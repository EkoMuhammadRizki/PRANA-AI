import type { Config } from "tailwindcss";
import { colors } from "./lib/tokens";

/**
 * Token desain PRANA-AI — nilai warna diambil dari lib/tokens.ts (salinan DESIGN.md).
 * Komponen WAJIB memakai token ini, jangan menulis hex langsung di className.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: colors as unknown as Record<string, string | Record<string, string>>,
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #FCB925 0%, #FB6717 55%, #D1410A 100%)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        caption: ["12px", { lineHeight: "1.4" }],
        body: ["14px", { lineHeight: "1.55" }],
        "card-title": ["16px", { lineHeight: "1.4" }],
        "page-title": ["24px", { lineHeight: "1.3" }],
        "class-title": ["28px", { lineHeight: "1.2" }],
        kpi: ["32px", { lineHeight: "1.1" }],
      },
      letterSpacing: { label: "0.06em" },
      borderRadius: { card: "16px", panel: "12px", btn: "10px" },
      boxShadow: { card: "0 1px 2px rgba(26,22,19,0.04)" },
      spacing: { "card-pad": "20px", topbar: "64px" },
      maxHeight: { "telemetry-strip": "96px" },
      keyframes: {
        "live-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.85)" },
        },
        // ── Ilustrasi landing page ──────────────────────────────
        "signal-travel": { from: { strokeDashoffset: "0" }, to: { strokeDashoffset: "-44" } },
        "ember-glow": {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        "wave-emit": {
          "0%, 100%": { opacity: "0.25", transform: "translateY(2px)" },
          "50%": { opacity: "1", transform: "translateY(-2px)" },
        },
      },
      animation: {
        "live-pulse": "live-pulse 2s ease-in-out infinite",
        "signal-travel": "signal-travel 1.6s linear infinite",
        "ember-glow": "ember-glow 2.4s ease-in-out infinite",
        "wave-emit": "wave-emit 2.8s ease-in-out infinite",
      },
      screens: { md: "768px", xl: "1280px" },
    },
  },
  plugins: [],
};

export default config;
