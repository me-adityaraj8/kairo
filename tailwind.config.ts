import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        deep: "var(--bg-deep)",
        mid: "var(--bg-mid)",
        raise: "var(--bg-raise)",
        stroke: "var(--stroke)",
        text: "var(--text)",
        dim: "var(--text-dim)",
        gold: "var(--gold)",
        "gold-deep": "var(--gold-deep)",
        xp: "var(--xp)",
        "xp-deep": "var(--xp-deep)",
        danger: "var(--danger)",
        violet: "var(--violet)",
        blue: "var(--blue)",
        common: "var(--common)",
        rare: "var(--rare)",
        epic: "var(--epic)",
        legendary: "var(--legendary)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        drift: {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "10%, 80%": { opacity: "1" },
          "100%": { transform: "translateY(-120px) translateX(14px)", opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        drift: "drift linear infinite",
        shimmer: "shimmer 1.8s infinite",
        pulseGlow: "pulseGlow 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
