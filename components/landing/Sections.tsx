import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconAntenna,
  IconCellular,
  IconClipboard,
  IconClock,
  IconDroplet,
  IconSignal,
  IconSlope,
  IconSpectrum,
  IconStorage,
  IconThermometer,
  IconWarning,
  IconWave,
  IconWifi,
} from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { CLASS_META } from "@/lib/domain";
import type { PeatClass } from "@/lib/types";
import { CrossSection, SlopeInversionDiagram } from "./CrossSection";
import { ParallaxLayer, Reveal } from "./Parallax";

/*
 * Seluruh angka pada halaman ini berasal dari proposal PKM-KC PRANA-AI:
 * karakterisasi Pre-PoC (Tabel 2.1) dan indikator capaian (Tabel 3.2).
 * Hasil uji dan target capaian sengaja dipisah agar tidak terbaca sebagai
 * klaim yang sudah terbukti.
 */

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cx("scroll-mt-24 py-16 md:py-24", className)}>
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <Reveal>
          <p className="label text-brand-deep">{eyebrow}</p>
          <h2 className="mt-2 max-w-3xl text-[26px] font-semibold leading-tight text-ink md:text-[34px]">
            {title}
          </h2>
          {lead && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted md:text-base">{lead}</p>}
        </Reveal>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// Hero
// ══════════════════════════════════════════════════════════════
export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative overflow-hidden pb-8 pt-10 md:pb-16 md:pt-16">
      {/* Latar dekoratif berlapis — bergerak paling lambat */}
      <ParallaxLayer speed={70} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-brand-tint blur-3xl" />
        <div className="absolute -left-24 top-48 h-[320px] w-[320px] rounded-full bg-k1-bg blur-3xl" />
      </ParallaxLayer>

      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-caption font-medium text-ink-muted">
                <span className="h-2 w-2 rounded-full bg-live-dot" />
                PKM-KC 2026 · Universitas Pendidikan Indonesia · Tema 8
              </p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-5 text-[32px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[42px] xl:text-[52px]">
                Bara di bawah gambut sering tak terbaca{" "}
                <span className="text-brand-deep">sensor titik</span>.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-5 text-[15px] leading-relaxed text-ink-muted md:text-base">
                PRANA-AI memindai <strong className="font-semibold text-ink">volume</strong> gambut, bukan satu
                titik. Sepasang antena dipole tertanam 15 cm di bawah permukaan merambatkan gelombang mikro
                2,4 GHz, lalu perubahan dielektrik medium dibaca dari matriks{" "}
                <strong className="font-semibold text-ink">52-Subcarrier Wi-Fi CSI</strong> dan diklasifikasikan
                di perangkat oleh Physics-Informed TinyML.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={signedIn ? "/dashboard" : "/login"}
                  className="inline-flex items-center justify-center rounded-btn bg-brand-gradient px-5 py-3 text-body font-semibold text-white transition-colors hover:bg-none hover:bg-brand-deep"
                >
                  {signedIn ? "Buka Dashboard" : "Masuk Dashboard"}
                </Link>
                <a
                  href="#cara-kerja"
                  className="inline-flex items-center justify-center rounded-btn border border-brand px-5 py-3 text-body font-semibold text-brand-deep transition-colors hover:bg-brand-tint"
                >
                  Lihat cara kerjanya
                </a>
              </div>
            </Reveal>
          </div>

          {/* Ilustrasi penampang — bergerak melawan arah scroll */}
          <div className="lg:col-span-7">
            <ParallaxLayer speed={-26}>
              <Reveal delay={120}>
                <CrossSection className="h-auto w-full" />
              </Reveal>
            </ParallaxLayer>
          </div>
        </div>

        <Reveal delay={200}>
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:mt-14 md:grid-cols-4">
            {[
              { v: "52", u: "subcarrier", k: "46 di antaranya aktif" },
              { v: "15", u: "cm", k: "kedalaman antena dipole" },
              { v: "2437", u: "MHz", k: "kanal 6 Wi-Fi 2,4 GHz" },
              { v: "3", u: "kelas", k: "keluaran TinyML INT8" },
            ].map((s) => (
              <div key={s.u} className="bg-surface p-5">
                <dt className="flex items-baseline gap-1.5">
                  <span className="num text-[28px] font-bold leading-none text-ink">{s.v}</span>
                  <span className="text-body text-ink-muted">{s.u}</span>
                </dt>
                <dd className="mt-1.5 text-caption text-ink-muted">{s.k}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// Masalah
// ══════════════════════════════════════════════════════════════
const PROBLEMS = [
  {
    icon: <IconThermometer size={22} />,
    title: "Panas tidak merambat ke sensor",
    body: "Difusivitas termal gambut hanya sekitar 10⁻⁷ m²/s. Panas tertahan di sekitar inti bara, sehingga termokopel titik beberapa sentimeter dari pusat pemanasan tidak merasakan apa pun.",
  },
  {
    icon: <IconDroplet size={22} />,
    title: "Permukaan menipu pembacaan",
    body: "Pada kelembapan sama 20% wb, gambut sehat terbaca ADC 1493 (84,1%), sedangkan gambut terdegradasi hidrofobik terbaca ADC 3558 (17,4%). Angka sensor titik saja tidak cukup untuk menyimpulkan kondisi.",
  },
  {
    icon: <IconSignal size={22} />,
    title: "RSSI tunggal tidak monoton",
    body: "Interferensi lintasan jamak menimbulkan multipath null −49,41 dBm pada 20% wb. Koefisien determinasi regresi kelembapan anjlok dari R² 0,947 menjadi 0,647 — daya terima saja menyesatkan.",
  },
];

export function Problem() {
  return (
    <Section
      id="masalah"
      eyebrow="Masalah"
      title="Kebakaran gambut menyala di dalam, bukan di permukaan"
      lead="Bara bawah permukaan merambat 0,1–1,0 m per hari pada suhu 250–600 °C. Saat asap terlihat di permukaan, api sudah berjalan lama. Tiga keterbatasan di bawah ini membuat pemantauan konvensional terlambat."
      className="bg-surface-muted/60"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {PROBLEMS.map((p, i) => (
          <Reveal key={p.title} delay={i * 90}>
            <article className="card h-full">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-btn bg-k3-bg text-k3-text">
                {p.icon}
              </span>
              <h3 className="mt-4 text-card-title font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-body leading-relaxed text-ink-muted">{p.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════
// Cara kerja
// ══════════════════════════════════════════════════════════════
const UNITS = [
  {
    tag: "Unit 1 · TX",
    icon: <IconAntenna size={20} />,
    title: "Pemancar & sensor tepi",
    points: [
      "Termokopel Tipe-K via MAX6675 (SPI) dan kelembapan FC-28 (ADC)",
      "Keduanya dipasang off-axis ≥ 8 cm agar zona Fresnel ke-1 tidak terdistorsi",
      "Menginjeksi 60 paket UDP per siklus adaptive burst",
    ],
  },
  {
    tag: "Unit 2 · RX",
    icon: <IconSpectrum size={20} />,
    title: "Penerima & ekstraktor CSI",
    points: [
      "Menangkap gelombang yang menembus medium gambut",
      "Mengekstraksi matriks 52-Subcarrier L-LTF, RSSI, dan PDR",
      "Meneruskan ke gateway lewat UART",
    ],
  },
  {
    tag: "Unit 3 · Edge-Gateway",
    icon: <IconSlope size={20} />,
    title: "Inferensi di perangkat",
    points: [
      "Menghitung β_CSI (kemiringan spektral) dan residu regresi dielektrik ΔR",
      "Menjalankan model Physics-Informed TinyML terkuantisasi INT8",
      "Mengirim hasil lewat telemetri hibrida tiga lapis",
    ],
  },
];

export function HowItWorks() {
  return (
    <Section
      id="cara-kerja"
      eyebrow="Cara kerja"
      title="Tiga node ESP32-S3 yang saling melengkapi"
      lead="Gelombang mikro yang merambat menembus gambut membawa jejak perubahan dielektrik medium. Jejak itu diurai per subcarrier, bukan dijumlahkan menjadi satu angka daya."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {UNITS.map((u, i) => (
          <Reveal key={u.tag} delay={i * 90}>
            <article className="card h-full">
              <div className="flex items-center gap-2">
                <span className="text-brand">{u.icon}</span>
                <span className="label text-brand-deep">{u.tag}</span>
              </div>
              <h3 className="mt-3 text-card-title font-semibold text-ink">{u.title}</h3>
              <ul className="mt-3 space-y-2">
                {u.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-body leading-relaxed text-ink-muted">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-line bg-surface p-5">
          <span className="label">Siklus pemindaian menyesuaikan kelas</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-body">
            {[
              ["KELAS_1", "15 menit"],
              ["KELAS_2", "3 menit"],
              ["KELAS_3", "1 menit"],
            ].map(([k, t]) => (
              <span key={k} className="flex items-center gap-2">
                <span className={cx("h-2.5 w-2.5 rounded-full", CLASS_META[k as PeatClass].bg, "border", CLASS_META[k as PeatClass].border)} />
                <span className="text-ink-muted">{CLASS_META[k as PeatClass].short}</span>
                <span className="num font-semibold text-ink">{t}</span>
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════
// Bukti Pre-PoC
// ══════════════════════════════════════════════════════════════
export function Evidence() {
  return (
    <Section
      id="bukti"
      eyebrow="Bukti karakterisasi"
      title="Tanda kemiringan spektral berbalik saat gambut bermasalah"
      lead={
        <>
          Hasil studi pendahuluan tim: 42 sesi pengujian, 2.520 paket pada kanal 6 (2437 MHz), daya pancar
          19,5 dBm, lintasan 8,5 cm. Angka di bawah adalah hasil karakterisasi laboratorium —{" "}
          <strong className="font-semibold text-ink">bukan data pemantauan langsung</strong>.
        </>
      }
      className="bg-surface-muted/60"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <div className="card h-full">
            <h3 className="text-card-title font-semibold text-ink">Inversi β_CSI pada 46 subcarrier aktif</h3>
            <p className="mt-1.5 text-caption text-ink-muted">
              Garis tren dari nilai β_CSI terukur. Subcarrier null 22–27 tidak dipakai dalam regresi.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-caption">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-6 rounded-full bg-series-baseline" />
                <span className="text-ink-muted">Normal hidrofilik — melandai (β negatif)</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-6 rounded-full bg-series-primary" />
                <span className="text-ink-muted">Anomali inti bara — menanjak (β positif)</span>
              </span>
            </div>
            <div className="mt-4">
              <SlopeInversionDiagram className="h-auto w-full" />
            </div>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:col-span-5">
          {[
            {
              state: "Normal hidrofilik",
              cls: "KELAS_1" as PeatClass,
              rows: [
                ["Kelembapan", "20% wb · ADC 1493 (84,1%)"],
                ["β_CSI", "−0,1959"],
                ["Pola", "melandai ke frekuensi tinggi"],
              ],
            },
            {
              state: "Degradasi hidrofobik",
              cls: "KELAS_2" as PeatClass,
              rows: [
                ["Kelembapan", "20% wb · ADC 3558 (17,4%)"],
                ["β_CSI", "+0,0873"],
                ["RSSI", "−29,07 dBm"],
              ],
            },
            {
              state: "Anomali inti bara",
              cls: "KELAS_3" as PeatClass,
              rows: [
                ["Sensor tepi", "ADC 2389 (55,1%) · 30,75 °C"],
                ["β_CSI · ΔR", "+0,0817 · +7,53 dB"],
                ["RSSI", "−19,07 dBm (lonjakan +30,34 dB)"],
              ],
            },
          ].map((c, i) => {
            const m = CLASS_META[c.cls];
            return (
              <Reveal key={c.state} delay={i * 90}>
                <article className={cx("rounded-card border border-l-4 p-5", m.bg, m.border, m.borderLeft)}>
                  <h3 className={cx("text-card-title font-semibold", m.text)}>{c.state}</h3>
                  <dl className="mt-3 space-y-1.5">
                    {c.rows.map(([k, v]) => (
                      <div key={k} className="flex flex-wrap justify-between gap-x-4 text-body">
                        <dt className="text-ink-muted">{k}</dt>
                        <dd className="num font-semibold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════
// Tiga kelas
// ══════════════════════════════════════════════════════════════
const CLASS_ACTION: Record<PeatClass, string> = {
  KELAS_1: "Patroli rutin diteruskan sesuai jadwal.",
  KELAS_2: "Muka air kanal diperiksa dan frekuensi patroli dinaikkan.",
  KELAS_3: "Dilaporkan ke posko, injeksi air difokuskan ke inti lintasan.",
};

export function Classes() {
  return (
    <Section
      id="kelas"
      eyebrow="Keluaran model"
      title="Tiga kelas kondisi, satu bahasa warna"
      lead="Setiap inferensi menyertakan tingkat kepercayaan model dan latensi komputasi. Warna pada dashboard tidak pernah dipakai sebagai hiasan — warna adalah status."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {(Object.keys(CLASS_META) as PeatClass[]).map((k, i) => {
          const m = CLASS_META[k];
          return (
            <Reveal key={k} delay={i * 90}>
              <article className={cx("h-full rounded-card border border-l-[6px] p-6", m.bg, m.border, m.borderLeft)}>
                <span className={cx("num rounded-full border px-3 py-1 text-caption font-semibold", m.text, m.border)}>
                  {k}
                </span>
                <h3 className={cx("mt-4 text-[22px] font-bold leading-tight", m.text)}>{m.label}</h3>
                <p className="mt-2 text-body leading-relaxed text-ink">{m.meaning}</p>
                <p className="mt-4 flex gap-2 border-t border-ink/10 pt-4 text-caption text-ink-muted">
                  <IconClipboard size={16} />
                  {CLASS_ACTION[k]}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════
// Telemetri hibrida
// ══════════════════════════════════════════════════════════════
const LAYERS = [
  {
    icon: <IconCellular size={20} />,
    tag: "Lapis 1",
    title: "Seluler 4G LTE Cat-1",
    body: "Modem SIMCom A7670E pada pita rendah 850/900 MHz mengirim hasil inferensi lewat MQTT/HTTPS dengan TLS 1.2. Ini jalur utama menuju cloud.",
    dot: "bg-live-dot",
  },
  {
    icon: <IconStorage size={20} />,
    tag: "Lapis 2",
    title: "Store-and-Forward",
    body: "Saat seluler putus, rekaman disimpan sebagai .CSV 17 kolom di memori internal 16MB (LittleFS) dan modul SPI Logger, lalu disinkronkan ulang begitu jaringan pulih.",
    dot: "bg-backfill-dot",
  },
  {
    icon: <IconWifi size={20} />,
    tag: "Lapis 3",
    title: "Wi-Fi APSTA lokal",
    body: "Stasiun memancarkan SSID sendiri ke perangkat petugas di lapangan. Keputusan AI dan kurva spektral tetap terbaca tanpa internet sama sekali.",
    dot: "bg-live-dot",
  },
];

export function Telemetry() {
  return (
    <Section
      id="telemetri"
      eyebrow="Telemetri hibrida"
      title="Tiga jalur yang saling menggantikan di kawasan blank-spot"
      lead="Status ketiga lapis ditampilkan terpisah di dashboard, tidak digabung menjadi satu indikator online/offline. Petugas perlu tahu apakah angka di layar adalah data langsung, data susulan, atau data basi — sebelum mengambil keputusan."
      className="bg-surface-muted/60"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {LAYERS.map((l, i) => (
          <Reveal key={l.tag} delay={i * 90}>
            <article className="card h-full">
              <div className="flex items-center gap-2">
                <span className={cx("h-2.5 w-2.5 rounded-full", l.dot)} />
                <span className="label">{l.tag}</span>
                <span className="ml-auto text-ink-muted">{l.icon}</span>
              </div>
              <h3 className="mt-3 text-card-title font-semibold text-ink">{l.title}</h3>
              <p className="mt-2 text-body leading-relaxed text-ink-muted">{l.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="mt-6 flex items-start gap-3 rounded-card border border-l-4 border-k2-border bg-k2-bg p-5">
          <span className="mt-0.5 shrink-0 text-k2-text">
            <IconWarning size={20} />
          </span>
          <p className="text-body text-ink">
            Saat jalur seluler terputus sementara antrean .CSV masih tersimpan, dashboard menampilkan
            keterangan tegas:{" "}
            <strong className="font-semibold">
              “Data terakhir dari store-and-forward — belum tentu kondisi terkini.”
            </strong>{" "}
            Kekosongan data tidak pernah diisi nilai dugaan.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════
// Dua lapis antarmuka
// ══════════════════════════════════════════════════════════════
export function Interface() {
  return (
    <Section
      id="antarmuka"
      eyebrow="Antarmuka"
      title="Dua lapis untuk dua kebutuhan berbeda"
      lead="Petugas patroli butuh keputusan dalam hitungan detik. Analis butuh bukti fisika yang bisa ditelusuri. Pemisahan ini ditegakkan sampai ke lapisan basis data, bukan sekadar disembunyikan di tampilan."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <article className="card h-full">
            <div className="flex items-center gap-2">
              <span className="text-brand">
                <IconWave size={20} />
              </span>
              <span className="label text-brand-deep">Lapis 1 · Petugas Patroli</span>
            </div>
            <h3 className="mt-3 text-[22px] font-semibold text-ink">Status Operasional</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                "Kartu status AI dengan kelas aktif, kepercayaan model, dan latensi inferensi",
                "Suhu tepi (°C) dan kelembapan tepi — nilai ADC selalu berpasangan dengan persentasenya",
                "CSI Spectral Slope dan daya terima RSSI beserta residu ΔR",
                "Rekomendasi tindakan ringkas, maksimal empat butir",
                "Strip status telemetri tiga lapis yang selalu terlihat tanpa menggulir",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-body leading-relaxed text-ink-muted">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-panel bg-surface-muted px-4 py-3 text-caption text-ink-muted">
              Kurva 52-subcarrier, PDR, dan tabel paket mentah sengaja tidak ditampilkan di lapis ini.
            </p>
          </article>
        </Reveal>

        <Reveal delay={100}>
          <article className="card h-full">
            <div className="flex items-center gap-2">
              <span className="text-brand">
                <IconSpectrum size={20} />
              </span>
              <span className="label text-brand-deep">Lapis 2 · Analis</span>
            </div>
            <h3 className="mt-3 text-[22px] font-semibold text-ink">Diagnostik Spektral CSI</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                "Kurva amplitudo 52-subcarrier L-LTF pada kanvas gelap, lengkap dengan penanda zona null 22–27",
                "Kualitas tautan RF: RSSI rata-rata ± simpangan baku, PDR, dan jumlah paket UDP",
                "Riwayat β_CSI dan ΔR terhadap waktu",
                "Tabel paket mentah dengan filter rentang waktu dan node",
                "Unduh rekapan mentah .CSV 17 kolom, seragam dengan format di perangkat",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-body leading-relaxed text-ink-muted">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-panel bg-surface-muted px-4 py-3 text-caption text-ink-muted">
              Akses ditolak di tiga tempat sekaligus: halaman, route handler, dan Row Level Security basis data.
            </p>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════
// Target capaian
// ══════════════════════════════════════════════════════════════
const TARGETS = [
  { icon: <IconAntenna size={18} />, metric: "≥ 98%", label: "Packet Delivery Ratio", note: "60 paket per siklus pada kedalaman 15 cm" },
  { icon: <IconSlope size={18} />, metric: "≥ 90%", label: "Akurasi klasifikasi", note: "F1-score ≥ 0,88 untuk tiga kelas" },
  { icon: <IconClock size={18} />, metric: "< 50 ms", label: "Latensi komputasi", note: "ekstraksi dan inferensi per siklus burst" },
  { icon: <IconStorage size={18} />, metric: "0%", label: "Kehilangan data", note: "saat fail-over seluler ke .CSV dan APSTA" },
  { icon: <IconCellular size={18} />, metric: "≥ 24 jam", label: "Operasi kontinu", note: "catu daya surya mandiri 20 Wp" },
];

export function Targets() {
  return (
    <Section
      eyebrow="Indikator capaian"
      title="Target yang akan diuji pada simulator strata gambut"
      lead="Angka berikut adalah target pengujian prototipe, belum hasil akhir. Keduanya sengaja dibedakan agar tidak terbaca sebagai capaian yang sudah terbukti."
      className="bg-surface-muted/60"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {TARGETS.map((t, i) => (
          <Reveal key={t.label} delay={i * 70}>
            <article className="card h-full">
              <span className="text-ink-muted">{t.icon}</span>
              <p className="num mt-3 text-[26px] font-bold leading-none text-ink">{t.metric}</p>
              <p className="mt-2 text-body font-semibold text-ink">{t.label}</p>
              <p className="mt-1 text-caption leading-relaxed text-ink-muted">{t.note}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════
// Penutup
// ══════════════════════════════════════════════════════════════
export function Closing({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <ParallaxLayer speed={50} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[360px] w-[680px] -translate-x-1/2 rounded-full bg-brand-tint blur-3xl" />
      </ParallaxLayer>

      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <Reveal>
          <div className="rounded-card border border-line bg-surface p-8 text-center md:p-12">
            <h2 className="mx-auto max-w-2xl text-[26px] font-semibold leading-tight text-ink md:text-[32px]">
              Lihat langsung dashboard dua lapisnya
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">
              Dashboard hanya menampilkan data yang benar-benar diterima dari stasiun. Bila belum ada paket
              yang masuk, layar menampilkan tanda “—” dan keterangan menunggu paket, bukan angka contoh.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={signedIn ? "/dashboard" : "/login"}
                className="inline-flex items-center justify-center rounded-btn bg-brand-gradient px-6 py-3 text-body font-semibold text-white transition-colors hover:bg-none hover:bg-brand-deep"
              >
                {signedIn ? "Buka Dashboard" : "Masuk Dashboard"}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-surface py-10">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 md:grid-cols-3 md:px-6">
        <div>
          <p className="text-card-title font-bold tracking-tight text-ink">PRANA-AI</p>
          <p className="mt-1.5 text-caption leading-relaxed text-ink-muted">
            Stasiun sentinel sekat kanal untuk deteksi dini bara bawah permukaan gambut, berbasis Channel
            State Information gelombang mikro dan Physics-Informed TinyML.
          </p>
        </div>
        <div>
          <p className="label">Program</p>
          <p className="mt-2 text-caption leading-relaxed text-ink-muted">
            PKM-KC 2026 · Tema 8 Pelestarian Lingkungan dan Mitigasi Bencana
            <br />
            Universitas Pendidikan Indonesia
          </p>
        </div>
        <div>
          <p className="label">Diseminasi</p>
          <p className="mt-2 text-caption leading-relaxed text-ink-muted">
            Instagram &amp; TikTok{" "}
            <span className="font-medium text-ink">@pranaai.pkmkc</span>
            <br />
            Ditujukan bagi instansi mitigasi bencana seperti BPBD, Manggala Agni, dan BRGM.
          </p>
        </div>
      </div>
    </footer>
  );
}
