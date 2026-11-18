# PRANA-AI — Dashboard Web Dua Lapis

Dashboard sentinel sekat kanal untuk deteksi dini kebakaran gambut (PKM-KC 2026, UPI).
Spesifikasi: [`AGENTS PRANA-AI.md`](./AGENTS%20PRANA-AI.md) (arsitektur & kontrak) dan
[`DESIGN PRANA-AI.md`](./DESIGN%20PRANA-AI.md) (visual).

```
ESP32-S3 Edge-Gateway ──MQTT/TLS──▶ Broker ──▶ apps/bridge (Node, selalu hidup)
                                                   │ service-role, RPC idempoten
                                                   ▼
                                     Supabase (Postgres + RLS + Realtime)
                                                   │ anon key + sesi pengguna
                                                   ▼
                                     Next.js 16 di Vercel (Lapis 1 / Lapis 2)
```

## Struktur

| Path | Isi |
|---|---|
| `app/page.tsx` | **Landing page publik** — profil sistem untuk penjurian PKM-KC |
| `components/landing` | Splash screen, parallax, ilustrasi penampang, seluruh seksi landing |
| `app/(user)/dashboard` | **Lapis 1** — Status Operasional (User & Analis) |
| `app/(analis)/analis` | **Lapis 2** — Diagnostik Spektral CSI (Analis saja; dijaga layout + page) |
| `app/api/export/csv` | Unduh rekapan `.CSV` 17 kolom (401/403 untuk non-analis, 501 sampai spesifikasi ada) |
| `components/lapis1`, `components/lapis2`, `components/telemetry` | Komponen dashboard |
| `lib/format.ts` | `formatMetric` + preset `fmt.*` (id-ID, tanda `+`/`−` wajib untuk β_CSI & ΔR, WIB) |
| `lib/telemetry.ts` | Logika status telemetri 3-lapis (dot, mode degradasi, anomali antrean) |
| `lib/physics.ts` | β_CSI ulang (persamaan 2 proposal) untuk garis fit verifikasi di Lapis 2 |
| `lib/tokens.ts` | Token warna DESIGN.md — sumber tunggal untuk Tailwind & grafik |
| `supabase/migrations/0001_init.sql` | Skema, RLS, RPC ingest, Realtime |
| `apps/bridge` | Worker MQTT → Supabase (pola A, AGENTS §4) — **tidak** di-deploy ke Vercel |

## Setup

### 1. Supabase
1. Buat proyek, lalu jalankan `supabase/migrations/0001_init.sql` (SQL Editor atau `supabase db push`).
2. Buat akun di **Authentication → Users**. Semua akun baru otomatis ber-role `user`.
3. Naikkan akun analis (hanya lewat SQL — user tidak bisa mengubah role sendiri):
   ```sql
   update public.profiles set role = 'analis'
   where user_id = (select id from auth.users where email = 'analis@contoh.id');
   ```
4. Lengkapi metadata node setelah node pertama mengirim paket (node dibuat otomatis oleh ingest):
   ```sql
   update public.nodes set lokasi = 'Sekat Kanal Blok A-01', depth_cm = 15, lat = …, lng = …
   where id = 'PRANA_NODE_01';
   ```
5. (Opsional) Baseline kalibrasi spektrum dari pengukuran normal terverifikasi → tabel `spectrum_baselines`.
6. **Tinjau `class_recommendations`** — teksnya draf dari proposal dan wajib disesuaikan SOP BPBD/Manggala Agni.

### 2. Web (lokal / Vercel)
```bash
cp .env.example .env.local     # isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev                    # http://localhost:3000
```
Di Vercel cukup set dua variabel `NEXT_PUBLIC_*`. **Jangan** taruh `SUPABASE_SERVICE_ROLE_KEY`
atau kredensial MQTT di proyek Vercel — aplikasi web tidak membutuhkannya.

### 3. Bridge MQTT (VPS / Railway / Fly.io)
```bash
cd apps/bridge
cp .env.example .env           # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MQTT_*
npm install
npm test                       # validasi kontrak payload, merger, deteksi antrean
npm run build && npm start
```
- Berlangganan `prana/+/+` QoS 1 dengan sesi persisten; PUBACK baru dikirim **setelah** pesan diproses.
- `telemetry` / `inference` / `spectrum` digabung per `(node_id, seq)`; `backfill` di-ingest dengan `source = backfill`.
- Duplikat `(node_id, seq)` di-skip di database (`on conflict do nothing`).
- Kegagalan DB permanen → `deadletter.jsonl` untuk diputar ulang.
- `GET /health` (Bearer `BRIDGE_SHARED_SECRET` bila diisi).

## Landing page & masuk

- **Landing publik di `/`** menjelaskan masalah, cara kerja, bukti karakterisasi Pre-PoC, tiga kelas,
  telemetri hibrida, dan dua lapis antarmuka. Halaman ini tetap terbuka tanpa sesi, dan tetap bisa
  dibuka walau Supabase belum dikonfigurasi.
- **Angka hasil uji dan target capaian dipisah tegas.** Seksi "Bukti karakterisasi" memuat hasil
  Pre-PoC (Tabel 2.1 proposal) dan diberi keterangan bahwa itu bukan data pemantauan langsung.
  Seksi "Indikator capaian" memuat target (Tabel 3.2), bukan hasil.
- **Splash screen** tampil sekali per sesi browser. Animasinya digerakkan CSS dengan `forwards`,
  jadi overlay tetap menghilang walau JavaScript gagal dimuat. Ada tombol lewati, dan pengguna
  dengan `prefers-reduced-motion` tidak melihatnya sama sekali.
  Untuk menampilkannya setiap kali halaman dibuka, hapus pemeriksaan `sessionStorage` di
  `components/landing/SplashScreen.tsx`.
- **Parallax dan animasi masuk** memakai `requestAnimationFrame` dan hanya menyentuh `transform`.
  Keduanya mati total saat pengguna meminta pengurangan gerak.
- **"Ingat saya" di halaman masuk** memperpanjang cookie sesi Supabase dan mengisikan email terakhir.
  Tanpa dicentang (default), cookie sesi hilang begitu browser ditutup — penting untuk tablet patroli
  yang dipakai bergantian. Logikanya ada di `lib/supabase/cookies.ts`.

## Keputusan desain yang perlu diketahui

- **RLS per kolom → tabel terpisah.** RLS Postgres bekerja per baris, jadi metrik diagnostik
  (RSSI SD, PDR, jumlah paket) dipindah ke `reading_diagnostics` (analis saja), seperti `spectra`.
  Peran User yang memanggil API langsung mendapat hasil kosong, bukan hanya UI tersembunyi.
- **Alert** dibuat oleh `ingest_reading` pada transisi naik (`KELAS_1 → 2/3` **dan** eskalasi `2 → 3`),
  dibandingkan dengan pembacaan sebelumnya menurut `recorded_at`.
- **Merah di panel telemetri** hanya bila tidak ada kontak > 10 menit **dan** status terakhir
  seluler putus **dan** APSTA mati.
- **Grafik tidak menyambung celah** > 35 menit (≈ 2 siklus Kelas 1) — tidak ada interpolasi visual.
- **Zona null 22–27** digambar dengan nilai mentahnya (≈0), mengikuti Figure 2 tim.

## Belum selesai — butuh keputusan tim

1. **Spesifikasi 17 kolom `.CSV`** (AGENTS §7). Kolom tidak dikarang; isi `CSV_SPEC` di `lib/csv.ts`
   sesuai firmware, lalu tombol unduh aktif otomatis.
2. **Ambang "Data tertunda" 10 menit vs. periode burst Kelas 1 = 15 menit** (proposal §3.4).
   Dengan aturan saat ini, node Normal yang sehat akan tampil "Data tertunda"/"Offline" ±1/3 waktu.
   Ambang ada di satu tempat: `STALE_AFTER_MS` di `lib/format.ts`.
