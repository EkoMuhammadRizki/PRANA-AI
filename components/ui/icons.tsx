/**
 * Ikon instrumen (DESIGN.md §6): gelombang, antena, termometer, tetesan air,
 * sinyal, grafik spektrum. Tanpa ikon dekoratif "api"/"pohon".
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconWave = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
    <path d="M2 17c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" opacity={0.5} />
  </Svg>
);

export const IconAntenna = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 9v12" />
    <path d="M8.5 21h7" />
    <circle cx="12" cy="7" r="2" />
    <path d="M7.8 3.8a6 6 0 0 0 0 6.4M16.2 3.8a6 6 0 0 1 0 6.4" />
  </Svg>
);

export const IconThermometer = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 14.8V4a2 2 0 1 0-4 0v10.8a4 4 0 1 0 4 0Z" />
    <path d="M12 9v8" />
  </Svg>
);

export const IconDroplet = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3s6 6.4 6 11a6 6 0 1 1-12 0c0-4.6 6-11 6-11Z" />
  </Svg>
);

export const IconSignal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20v-3M9 20v-7M14 20v-11M19 20V4" />
  </Svg>
);

export const IconSpectrum = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3v18h18" />
    <path d="M6 16l3-6 3 3 3-8 3 6" />
  </Svg>
);

export const IconSlope = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3v18h18" />
    <path d="M6 17 19 7" />
    <path d="M14 7h5v5" />
  </Svg>
);

export const IconCellular = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 20v-4M10 20v-8M15 20V8M20 20V4" />
  </Svg>
);

export const IconStorage = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 7h6M9 11h6M9 15h3" />
  </Svg>
);

export const IconWifi = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 8.5a14 14 0 0 1 19 0M5.5 12a9.5 9.5 0 0 1 13 0M8.5 15.5a5 5 0 0 1 7 0" />
    <circle cx="12" cy="19" r="1" />
  </Svg>
);

export const IconWarning = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 10v4M12 17h.01" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Svg>
);

export const IconClipboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
