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
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#b9f8cf",
          300: "#7bf1a8",
          400: "#05df72",
          500: "#00c951", // hlavná zelená
          600: "#00a63e",
          700: "#008236",
          800: "#016630",
          900: "#016630",
        },
        ink: {
          900: "#0f172a", // titulky
          800: "#172036",
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
