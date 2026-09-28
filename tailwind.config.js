import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "sans-serif"],
        display: ["Syne", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
        pixel: ['"Press Start 2P"', "monospace"],
        terminal: ["VT323", "monospace"],
      },
      colors: {
        bg: "hsl(var(--bg) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        panel: "hsl(var(--panel) / <alpha-value>)",
        "text-primary": "hsl(var(--text) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        stroke: "hsl(var(--stroke) / <alpha-value>)",
      },
    },
  },
  plugins: [
    animate,
    function addLightVariant({ addVariant }) {
      addVariant("light", ":is(.light) &");
    },
  ],
};
