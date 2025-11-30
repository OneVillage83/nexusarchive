import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "na-bg": "#020617",
        "na-surface": "#020818",
        "na-surface-soft": "#0b1728",
        "na-blue": "#1e40af",
        "na-cyan": "#38bdf8",
        "na-gold": "#facc15",
        "na-ember": "#f97316",
        "na-emerald": "#22c55e",
      },

      boxShadow: {
        "na-glow": "0 0 12px 4px rgba(56, 189, 248, 0.45)", // cyan glow
        "na-gold": "0 0 14px 3px rgba(250, 204, 21, 0.45)", // golden glow
      },

      backgroundImage: {
        "na-spotlight":
          "radial-gradient(circle at center, rgba(56,189,248,0.12), transparent 70%)",
      },

      transitionProperty: {
        glow: "box-shadow, background-color, border-color, color",
      },
    },
  },
  plugins: [],
};

export default config;
