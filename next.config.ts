import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Memungkinkan `next build` berjalan tanpa mengganggu `next dev` yang sedang hidup.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Spesifikasi agent proyek ada di "AGENTS PRANA-AI.md"; jangan biarkan next dev membuat AGENTS.md lain.
  agentRules: false,
};

export default nextConfig;
