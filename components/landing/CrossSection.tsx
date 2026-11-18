import { colors } from "@/lib/tokens";

/**
 * Penampang stasiun sentinel PRANA-AI — mengacu Gambar 5.1 proposal:
 * boks IP65 di atas tiang, garpu PVC U-Shape pada kedalaman 15 cm,
 * sepasang antena dipole, dan sensor off-axis di luar zona Fresnel ke-1.
 */
export function CrossSection({ className }: { className?: string }) {
  const SOIL = "#EFE8DF";
  const SOIL_DEEP = "#E4DACB";

  return (
    <svg
      viewBox="0 0 760 470"
      className={className}
      role="img"
      aria-labelledby="xsec-title xsec-desc"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="xsec-title">Penampang stasiun sentinel PRANA-AI</title>
      <desc id="xsec-desc">
        Boks kendali di atas permukaan, sepasang antena dipole tertanam 15 cm di bawah tanah, dan lintasan
        gelombang mikro 2,4 GHz yang melewati kantong bara di inti lapisan gambut. Sensor suhu dan kelembapan
        dipasang di luar sumbu lintasan.
      </desc>

      <defs>
        <linearGradient id="xsec-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SOIL} />
          <stop offset="100%" stopColor={SOIL_DEEP} />
        </linearGradient>
        <radialGradient id="xsec-ember">
          <stop offset="0%" stopColor={colors.k3.border} stopOpacity="0.85" />
          <stop offset="60%" stopColor={colors.k3.border} stopOpacity="0.22" />
          <stop offset="100%" stopColor={colors.k3.border} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="xsec-path" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.brand.DEFAULT} stopOpacity="0.1" />
          <stop offset="50%" stopColor={colors.brand.DEFAULT} stopOpacity="0.26" />
          <stop offset="100%" stopColor={colors.brand.DEFAULT} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* ── Lapisan tanah ───────────────────────────────────────── */}
      <rect x="0" y="196" width="760" height="274" fill="url(#xsec-soil)" />
      <line x1="0" y1="196" x2="760" y2="196" stroke="#C9BBA6" strokeWidth="2" />
      {/* Zona rawan bara 10–30 cm */}
      <rect x="0" y="232" width="760" height="100" fill={colors.k3.border} opacity="0.045" />
      <text x="18" y="224" fill="#8C7B63" fontSize="11" fontFamily="var(--font-inter)">
        Permukaan gambut (0 cm)
      </text>
      <text x="18" y="252" fill="#8C7B63" fontSize="11" fontFamily="var(--font-inter)">
        Zona rawan bara 10–30 cm
      </text>

      {/* ── Struktur atas: panel surya, boks, antena 4G ─────────── */}
      <g stroke={colors.ink.muted} strokeWidth="2" fill="none">
        <path d="M250 56 L330 38 L348 50 L268 68 Z" fill="#DCE6F0" />
        <line x1="299" y1="62" x2="299" y2="92" />
      </g>
      <rect
        x="286"
        y="92"
        width="190"
        height="66"
        rx="8"
        fill={colors.surface.DEFAULT}
        stroke={colors.line}
        strokeWidth="2"
      />
      <text x="381" y="118" textAnchor="middle" fontSize="12" fontWeight="600" fill={colors.ink.DEFAULT} fontFamily="var(--font-inter)">
        Boks IP65
      </text>
      <text x="381" y="136" textAnchor="middle" fontSize="11" fill={colors.ink.muted} fontFamily="var(--font-inter)">
        3× ESP32-S3 · TinyML INT8
      </text>
      <text x="381" y="151" textAnchor="middle" fontSize="11" fill={colors.ink.muted} fontFamily="var(--font-inter)">
        Modem 4G · LittleFS · APSTA
      </text>

      {/* Antena 4G */}
      <g stroke={colors.ink.muted} strokeWidth="2" strokeLinecap="round">
        <line x1="500" y1="54" x2="500" y2="124" />
        <line x1="500" y1="124" x2="476" y2="138" />
      </g>
      <g className="motion-safe:animate-wave-emit" style={{ transformOrigin: "500px 54px" }}>
        <path d="M488 44 a16 16 0 0 1 24 0" stroke={colors.brand.DEFAULT} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M480 34 a28 28 0 0 1 40 0" stroke={colors.brand.DEFAULT} strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
      </g>

      {/* Tiang */}
      <g stroke={colors.ink.muted} strokeWidth="3" strokeLinecap="round">
        <line x1="381" y1="158" x2="381" y2="196" />
        <line x1="381" y1="178" x2="344" y2="196" />
        <line x1="381" y1="178" x2="418" y2="196" />
      </g>

      {/* ── Garpu PVC U-Shape + antena dipole ───────────────────── */}
      <g stroke="#9AA7B4" strokeWidth="9" strokeLinecap="round" fill="none">
        <path d="M300 196 L300 300" />
        <path d="M462 196 L462 300" />
      </g>

      {/* Lintasan CSI */}
      <ellipse cx="381" cy="300" rx="104" ry="30" fill="url(#xsec-path)" stroke={colors.brand.DEFAULT} strokeOpacity="0.35" strokeDasharray="5 5" />
      <line
        x1="310"
        y1="300"
        x2="452"
        y2="300"
        stroke={colors.brand.DEFAULT}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="10 12"
        className="motion-safe:animate-signal-travel"
      />

      {/* Antena dipole TX & RX */}
      <ellipse cx="300" cy="300" rx="11" ry="16" fill={colors.brand.DEFAULT} />
      <ellipse cx="462" cy="300" rx="11" ry="16" fill={colors.brand.DEFAULT} />
      <text x="300" y="338" textAnchor="middle" fontSize="11" fontWeight="600" fill={colors.brand.deep} fontFamily="var(--font-inter)">
        TX
      </text>
      <text x="462" y="338" textAnchor="middle" fontSize="11" fontWeight="600" fill={colors.brand.deep} fontFamily="var(--font-inter)">
        RX
      </text>

      {/* Kantong bara di inti lintasan */}
      <circle cx="381" cy="300" r="34" fill="url(#xsec-ember)" className="motion-safe:animate-ember-glow" />
      <circle cx="381" cy="300" r="7" fill={colors.k3.border} />

      {/* Kedalaman 15 cm */}
      <g stroke="#8C7B63" strokeWidth="1.5">
        <line x1="236" y1="196" x2="236" y2="300" strokeDasharray="4 4" />
        <line x1="230" y1="196" x2="242" y2="196" />
        <line x1="230" y1="300" x2="242" y2="300" />
      </g>
      <text x="228" y="252" textAnchor="end" fontSize="12" fontWeight="600" fill="#6B5B45" fontFamily="var(--font-jetbrains)">
        15 cm
      </text>

      {/* ── Sensor off-axis (≥ 8 cm di luar sumbu) ──────────────── */}
      <g stroke={colors.ink.muted} strokeWidth="2.5" strokeLinecap="round">
        <line x1="576" y1="196" x2="576" y2="268" />
        <line x1="604" y1="196" x2="604" y2="258" />
      </g>
      <circle cx="576" cy="272" r="7" fill={colors.k3.border} />
      <rect x="597" y="258" width="14" height="18" rx="3" fill={colors.series.baseline} />
      <text x="624" y="238" fontSize="11" fontWeight="600" fill={colors.ink.DEFAULT} fontFamily="var(--font-inter)">
        Sensor tepi
      </text>
      <text x="624" y="254" fontSize="11" fill={colors.ink.muted} fontFamily="var(--font-inter)">
        MAX6675 · FC-28
      </text>
      <text x="624" y="270" fontSize="11" fill={colors.ink.muted} fontFamily="var(--font-inter)">
        off-axis ≥ 8 cm
      </text>
    </svg>
  );
}

/**
 * Diagram inversi CSI Spectral Slope — garis tren dari nilai β_CSI yang
 * dilaporkan pada karakterisasi Pre-PoC (Tabel 2.1 proposal), bukan rekonstruksi
 * 52 amplitudo. Zona null 22–27 diarsir dan tidak ikut diregresi.
 */
export function SlopeInversionDiagram({ className }: { className?: string }) {
  const W = 560;
  const H = 260;
  const padX = 44;
  const padY = 28;
  const x = (k: number) => padX + ((k - 1) / 51) * (W - padX - 16);
  const y = (v: number) => padY + ((0.26 - v) / 0.52) * (H - padY - 34);

  const line = (slope: number) => {
    const mid = 26.5;
    return `M ${x(1)} ${y(slope * (1 - mid) * 0.04)} L ${x(52)} ${y(slope * (52 - mid) * 0.04)}`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-labelledby="slope-title">
      <title id="slope-title">
        Perbandingan kemiringan spektral: negatif pada gambut normal, positif pada degradasi hidrofobik dan
        anomali inti bara
      </title>
      <rect x="0" y="0" width={W} height={H} rx="12" fill={colors.spectral.bg} />

      {[0.26, 0.13, 0, -0.13, -0.26].map((v) => (
        <line key={v} x1={padX} y1={y(v)} x2={W - 16} y2={y(v)} stroke={colors.spectral.grid} strokeWidth="1" />
      ))}
      {/* Zona null 22–27 */}
      <rect x={x(22)} y={padY} width={x(27) - x(22)} height={H - padY - 34} fill="rgba(255,255,255,0.06)" />
      <text x={(x(22) + x(27)) / 2} y={padY + 14} textAnchor="middle" fontSize="9" fill={colors.spectral.axis}>
        Null
      </text>

      <line x1={padX} y1={y(0)} x2={W - 16} y2={y(0)} stroke={colors.series.threshold} strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Normal hidrofilik: β negatif */}
      <path d={line(-0.1959)} stroke={colors.series.baseline} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Anomali inti bara: β positif */}
      <path d={line(0.0817)} stroke={colors.series.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Label menempel di ujung kanan masing-masing garis. */}
      <text
        x={W - 22}
        y={y(-0.1959 * 25.5 * 0.04) + 16}
        textAnchor="end"
        fontSize="11"
        fill={colors.series.baseline}
        fontFamily="var(--font-jetbrains)"
      >
        −0,1959
      </text>
      <text
        x={W - 22}
        y={y(0.0817 * 25.5 * 0.04) - 10}
        textAnchor="end"
        fontSize="11"
        fill={colors.series.primary}
        fontFamily="var(--font-jetbrains)"
      >
        +0,0817
      </text>

      <text x={padX} y={H - 12} fontSize="10" fill={colors.spectral.axis} fontFamily="var(--font-inter)">
        Pita Bawah (1–21)
      </text>
      <text x={W - 16} y={H - 12} textAnchor="end" fontSize="10" fill={colors.spectral.axis} fontFamily="var(--font-inter)">
        Pita Atas (28–52)
      </text>
      <text x={padX} y={y(0) - 6} fontSize="9" fill={colors.spectral.axis} fontFamily="var(--font-inter)">
        β = 0 · ambang inversi
      </text>
    </svg>
  );
}
