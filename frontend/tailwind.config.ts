import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/features/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/shared/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // ✅ Tailwind Emerald (HEX)
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // MAIN
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },

        // ✅ TEXT COLORS (neutrálne, nech zelená nepôsobí "muddied")
        ink: {
          900: "#0f172a", // slate-900
          800: "#1e293b", // slate-800
          700: "#334155", // slate-700
          500: "#64748b", // slate-500
        },

        // ✅ BACKGROUNDS & SURFACES
        paper: "#f8fafc", // slate-50
        soft: "#ecfdf5", // emerald-50 (jemné zelené sekcie/hover)
        border: "#e2e8f0", // slate-200

        // ✅ Optional dark
        night: "#020617", // slate-950
      },

      boxShadow: {
        soft: "0 4px 24px rgba(15, 23, 42, 0.06)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
