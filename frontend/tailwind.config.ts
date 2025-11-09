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
        primary: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#b7d1ff",
          300: "#8bb5ff",
          400: "#5f97ff",
          500: "#3a79f6", // hlavná modrá
          600: "#275fda",
          700: "#1e4bb0",
          800: "#1a418f",
          900: "#183a78",
        },
        ink: {
          900: "#0f172a", // titulky
          700: "#1f2937", // text
          500: "#6b7280", // sekundárny
        },
        paper: "#f5f7fb",
        night: "#0b2038",
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
