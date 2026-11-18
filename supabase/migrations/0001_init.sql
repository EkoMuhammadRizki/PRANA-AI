-- ════════════════════════════════════════════════════════════════════
-- PRANA-AI — skema awal Supabase
-- Kontrak: AGENTS.md §1.2 (3 kelas), §4.2 (payload), §5 (model data)
--
-- Catatan pemisahan Lapis 1 / Lapis 2:
-- RLS Postgres bekerja per BARIS, bukan per kolom. Agar "kolom diagnostik
-- hanya terbaca analis" benar-benar ditegakkan di lapisan data, metrik
-- diagnostik (rssi_sd, pdr_pct, jumlah paket) dipisah ke tabel
-- reading_diagnostics, sama seperti spectra. Tabel readings hanya berisi
-- metrik Lapis 1 (yang boleh dilihat peran User).
-- ════════════════════════════════════════════════════════════════════

-- ── Tipe kontrak ───────────────────────────────────────────────────
-- Urutan enum = tingkat keparahan (dipakai untuk deteksi eskalasi).
create type public.peat_class as enum ('KELAS_1', 'KELAS_2', 'KELAS_3');
create type public.user_role as enum ('user', 'analis');
create type public.reading_source as enum ('live', 'backfill');

-- ── profiles ───────────────────────────────────────────────────────
create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null default 'user',
  full_name  text,
  created_at timestamptz not null default now()
);

-- Setiap akun baru otomatis ber-role 'user'. Role 'analis' HANYA bisa
-- diberikan lewat SQL oleh admin (lihat README), tidak lewat metadata signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_analis()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'analis'
  );
$$;

-- ── nodes ──────────────────────────────────────────────────────────
create table public.nodes (
  id                     text primary key,               -- 'PRANA_NODE_01'
  name                   text not null,
  lokasi                 text,                           -- 'Sekat Kanal Blok A-01'
  depth_cm               numeric(5, 1),
  lat                    double precision,
  lng                    double precision,
  last_seen_at           timestamptz,                    -- recorded_at terbaru yang diketahui
  -- Status telemetri 3-lapis terakhir (AGENTS §2.1). Tidak berisi data spektral.
  link                   jsonb,
  link_recorded_at       timestamptz,
  -- Ditandai bridge bila antrean store-and-forward terus naik tanpa turun.
  buffer_backlog_growing boolean not null default false,
  battery_v              numeric(4, 2),
  created_at             timestamptz not null default now()
);

-- ── readings (Lapis 1) ─────────────────────────────────────────────
create table public.readings (
  id           bigint generated always as identity primary key,
  node_id      text not null references public.nodes (id),
  seq          bigint not null,
  recorded_at  timestamptz not null,                     -- waktu perangkat (UTC)
  received_at  timestamptz not null default now(),       -- waktu tiba di server
  source       public.reading_source not null default 'live',
  class        public.peat_class not null,
  confidence   numeric(5, 2) not null check (confidence between 0 and 100),
  latency_ms   integer not null check (latency_ms >= 0),
  temp_edge_c  numeric(6, 2),                            -- MAX6675, off-axis
  adc_fc28     integer check (adc_fc28 between 0 and 4095),
  moisture_pct numeric(5, 2) check (moisture_pct between 0 and 100),
  beta_csi     numeric(10, 6) not null,                  -- tanda +/− wajib dipertahankan
  delta_r_db   numeric(8, 3) not null,
  rssi_dbm     numeric(7, 2) not null,
  link         jsonb,
  constraint readings_node_seq_key unique (node_id, seq) -- kunci idempotensi
);

create index readings_node_recorded_idx on public.readings (node_id, recorded_at desc);

-- ── reading_diagnostics (Lapis 2 — analis saja) ────────────────────
create table public.reading_diagnostics (
  reading_id  bigint primary key references public.readings (id) on delete cascade,
  node_id     text not null references public.nodes (id),
  recorded_at timestamptz not null,
  rssi_sd     numeric(7, 3),
  pdr_pct     numeric(5, 2) check (pdr_pct between 0 and 100),
  packets_tx  integer check (packets_tx >= 0),
  packets_rx  integer check (packets_rx >= 0)
);

create index reading_diagnostics_node_recorded_idx
  on public.reading_diagnostics (node_id, recorded_at desc);

-- ── spectra (Lapis 2 — analis saja) ────────────────────────────────
create table public.spectra (
  id          bigint generated always as identity primary key,
  reading_id  bigint not null unique references public.readings (id) on delete cascade,
  node_id     text not null references public.nodes (id),
  recorded_at timestamptz not null,
  amplitudes  numeric[] not null check (array_length(amplitudes, 1) = 52),
  channel     smallint not null default 6,
  freq_mhz    integer not null default 2437
);

create index spectra_node_recorded_idx on public.spectra (node_id, recorded_at desc);

-- Baseline kalibrasi (garis referensi putus-putus #0EA5E9 di grafik spektral).
-- Diisi oleh analis dari pengukuran kondisi normal terverifikasi.
create table public.spectrum_baselines (
  id          bigint generated always as identity primary key,
  node_id     text not null references public.nodes (id),
  amplitudes  numeric[] not null check (array_length(amplitudes, 1) = 52),
  captured_at timestamptz not null,
  note        text,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now()
);

create index spectrum_baselines_node_idx on public.spectrum_baselines (node_id, captured_at desc);

-- ── Rekomendasi tindakan per kelas ─────────────────────────────────
-- Satu sumber kebenaran untuk teks rekomendasi (dipakai alert & UI Lapis 1).
-- Maksimal 4 butir, kalimat imperatif (DESIGN.md §3).
create table public.class_recommendations (
  class      public.peat_class primary key,
  items      text[] not null check (array_length(items, 1) between 1 and 4),
  updated_at timestamptz not null default now()
);

-- DRAF berdasarkan proposal PKM-KC (Gambar 5.4 & §3.4) — wajib ditinjau tim dan
-- disesuaikan SOP BPBD / Manggala Agni setempat sebelum dipakai di lapangan.
-- Periode adaptive burst firmware: 15 mnt (Kelas 1), 3 mnt (Kelas 2), 1 mnt (Kelas 3).
insert into public.class_recommendations (class, items) values
  ('KELAS_1', array[
    'Lanjutkan patroli rutin sesuai jadwal.',
    'Jaga sekat kanal tetap utuh dan muka air terpelihara.'
  ]),
  ('KELAS_2', array[
    'Periksa muka air kanal dan tutup kebocoran sekat.',
    'Basahi gambut di sekitar garpu antena — jangan percaya sensor kelembapan titik.',
    'Naikkan frekuensi patroli di blok ini.',
    'Pantau perubahan kelas; siklus pemindaian dipercepat ke 3 menit.'
  ]),
  ('KELAS_3', array[
    'Laporkan segera ke BPBD / Manggala Agni setempat.',
    'Lakukan injeksi air gambut (peat spear) pada titik stasiun.',
    'Fokuskan pemadaman di tengah lintasan garpu antena, bukan hanya permukaan.',
    'Pantau terus — siklus pemindaian dipercepat ke 1 menit.'
  ]);

-- ── alerts ─────────────────────────────────────────────────────────
create table public.alerts (
  id              bigint generated always as identity primary key,
  node_id         text not null references public.nodes (id),
  reading_id      bigint not null unique references public.readings (id) on delete cascade,
  class           public.peat_class not null,
  previous_class  public.peat_class,
  recommendation  text[] not null,
  recorded_at     timestamptz not null,
  source          public.reading_source not null,
  created_at      timestamptz not null default now(),
  acknowledged_by uuid references auth.users (id),
  acknowledged_at timestamptz
);

create index alerts_node_created_idx on public.alerts (node_id, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- Ingest (dipanggil bridge MQTT dengan service-role, BUKAN oleh client)
-- ════════════════════════════════════════════════════════════════════

-- Satu transaksi: readings + diagnostics + spectra + status node + alert.
-- Idempoten: (node_id, seq) yang sudah ada di-skip, tidak ditulis ulang.
create or replace function public.ingest_reading(p jsonb, p_source public.reading_source default 'live')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_node     text := p ->> 'node_id';
  v_recorded timestamptz := (p ->> 'recorded_at')::timestamptz;
  v_class    public.peat_class := (p ->> 'class')::public.peat_class;
  v_id       bigint;
  v_prev     public.peat_class;
begin
  insert into public.nodes (id, name) values (v_node, v_node)
  on conflict (id) do nothing;

  insert into public.readings (
    node_id, seq, recorded_at, source, class, confidence, latency_ms,
    temp_edge_c, adc_fc28, moisture_pct, beta_csi, delta_r_db, rssi_dbm, link
  ) values (
    v_node,
    (p ->> 'seq')::bigint,
    v_recorded,
    p_source,
    v_class,
    (p ->> 'confidence')::numeric,
    (p ->> 'latency_ms')::integer,
    (p ->> 'temp_edge_c')::numeric,
    (p ->> 'adc_fc28')::integer,
    (p ->> 'moisture_pct')::numeric,
    (p ->> 'beta_csi')::numeric,
    (p ->> 'delta_r_db')::numeric,
    (p ->> 'rssi_dbm')::numeric,
    p -> 'link'
  )
  on conflict (node_id, seq) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('status', 'duplicate');
  end if;

  insert into public.reading_diagnostics (reading_id, node_id, recorded_at, rssi_sd, pdr_pct, packets_tx, packets_rx)
  values (
    v_id, v_node, v_recorded,
    (p ->> 'rssi_sd')::numeric,
    (p ->> 'pdr_pct')::numeric,
    (p ->> 'packets_tx')::integer,
    (p ->> 'packets_rx')::integer
  );

  if jsonb_typeof(p -> 'spectrum') = 'array' then
    insert into public.spectra (reading_id, node_id, recorded_at, amplitudes, channel, freq_mhz)
    values (
      v_id, v_node, v_recorded,
      array(select x::numeric from jsonb_array_elements_text(p -> 'spectrum') as x),
      coalesce((p ->> 'channel')::smallint, 6),
      coalesce((p ->> 'freq_mhz')::integer, 2437)
    );
  end if;

  -- Status node hanya maju bila pesan ini lebih baru (data bisa datang tak berurutan).
  update public.nodes n set
    last_seen_at     = greatest(coalesce(n.last_seen_at, '-infinity'::timestamptz), v_recorded),
    link             = case when p ? 'link' and (n.link_recorded_at is null or v_recorded >= n.link_recorded_at)
                            then p -> 'link' else n.link end,
    link_recorded_at = case when p ? 'link' and (n.link_recorded_at is null or v_recorded >= n.link_recorded_at)
                            then v_recorded else n.link_recorded_at end
  where n.id = v_node;

  -- Alert pada transisi naik (KELAS_1 → KELAS_2/3, juga eskalasi KELAS_2 → KELAS_3).
  -- Pembanding = pembacaan tepat sebelumnya menurut recorded_at, bukan received_at.
  select r.class into v_prev
  from public.readings r
  where r.node_id = v_node and r.recorded_at < v_recorded
  order by r.recorded_at desc
  limit 1;

  if v_class <> 'KELAS_1' and (v_prev is null or v_prev < v_class) then
    insert into public.alerts (node_id, reading_id, class, previous_class, recommendation, recorded_at, source)
    select v_node, v_id, v_class, v_prev, cr.items, v_recorded, p_source
    from public.class_recommendations cr
    where cr.class = v_class;
  end if;

  return jsonb_build_object('status', 'inserted', 'reading_id', v_id);
end;
$$;

-- Spektrum yang tiba terpisah SETELAH reading-nya tersimpan (topik prana/{node_id}/spectrum).
-- Idempoten: bila reading belum ada atau spektrum sudah ada, tidak ada yang ditulis.
create or replace function public.attach_spectrum(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  insert into public.spectra (reading_id, node_id, recorded_at, amplitudes, channel, freq_mhz)
  select r.id, r.node_id, r.recorded_at,
         array(select x::numeric from jsonb_array_elements_text(p -> 'spectrum') as x),
         coalesce((p ->> 'channel')::smallint, 6),
         coalesce((p ->> 'freq_mhz')::integer, 2437)
  from public.readings r
  where r.node_id = p ->> 'node_id' and r.seq = (p ->> 'seq')::bigint
  on conflict (reading_id) do nothing
  returning reading_id into v_id;

  return jsonb_build_object('status', case when v_id is null then 'skipped' else 'inserted' end);
end;
$$;

-- Heartbeat dari topik prana/{node_id}/status
create or replace function public.ingest_status(
  p jsonb,
  p_backlog_growing boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_node     text := p ->> 'node_id';
  v_recorded timestamptz := (p ->> 'recorded_at')::timestamptz;
begin
  insert into public.nodes (id, name) values (v_node, v_node)
  on conflict (id) do nothing;

  update public.nodes n set
    last_seen_at           = greatest(coalesce(n.last_seen_at, '-infinity'::timestamptz), v_recorded),
    link                   = case when n.link_recorded_at is null or v_recorded >= n.link_recorded_at
                                  then coalesce(p -> 'link', n.link) else n.link end,
    link_recorded_at       = case when n.link_recorded_at is null or v_recorded >= n.link_recorded_at
                                  then v_recorded else n.link_recorded_at end,
    battery_v              = coalesce((p ->> 'battery_v')::numeric, n.battery_v),
    buffer_backlog_growing = p_backlog_growing
  where n.id = v_node;
end;
$$;

revoke all on function public.ingest_reading(jsonb, public.reading_source) from public, anon, authenticated;
revoke all on function public.ingest_status(jsonb, boolean) from public, anon, authenticated;
revoke all on function public.attach_spectrum(jsonb) from public, anon, authenticated;
grant execute on function public.ingest_reading(jsonb, public.reading_source) to service_role;
grant execute on function public.attach_spectrum(jsonb) to service_role;
grant execute on function public.ingest_status(jsonb, boolean) to service_role;

-- ════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════
alter table public.profiles              enable row level security;
alter table public.nodes                 enable row level security;
alter table public.readings              enable row level security;
alter table public.reading_diagnostics   enable row level security;
alter table public.spectra               enable row level security;
alter table public.spectrum_baselines    enable row level security;
alter table public.class_recommendations enable row level security;
alter table public.alerts                enable row level security;

-- Tidak ada akses anonim sama sekali.
revoke all on all tables in schema public from anon;

-- profiles: baca profil sendiri; analis boleh membaca semua. Tidak ada
-- kebijakan update → user tidak bisa menaikkan role-nya sendiri.
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_analis());

-- Lapis 1 — semua pengguna terautentikasi
create policy nodes_select on public.nodes
  for select to authenticated using (true);

create policy readings_select on public.readings
  for select to authenticated using (true);

create policy class_recommendations_select on public.class_recommendations
  for select to authenticated using (true);

create policy alerts_select on public.alerts
  for select to authenticated using (true);

-- Pengakuan alert: hanya kolom acknowledged_* yang bisa diubah, atas nama diri sendiri.
revoke update on public.alerts from authenticated;
grant update (acknowledged_by, acknowledged_at) on public.alerts to authenticated;
create policy alerts_acknowledge on public.alerts
  for update to authenticated
  using (acknowledged_at is null)
  with check (acknowledged_by = auth.uid());

-- Lapis 2 — analis saja (ditolak di lapisan data untuk peran User)
create policy reading_diagnostics_select_analis on public.reading_diagnostics
  for select to authenticated using (public.is_analis());

create policy spectra_select_analis on public.spectra
  for select to authenticated using (public.is_analis());

create policy spectrum_baselines_select_analis on public.spectrum_baselines
  for select to authenticated using (public.is_analis());

create policy spectrum_baselines_insert_analis on public.spectrum_baselines
  for insert to authenticated
  with check (public.is_analis() and created_by = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- Realtime (postgres_changes menghormati RLS di atas)
-- ════════════════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.readings;
alter publication supabase_realtime add table public.nodes;
alter publication supabase_realtime add table public.alerts;
