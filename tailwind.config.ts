import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A6B3A",
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#1A6B3A",
          600: "#166330",
          700: "#125428",
          800: "#0E4520",
          900: "#0A3618",
        },
        secondary: {
          DEFAULT: "#F5A623",
          50: "#FFF8EC",
          100: "#FEEECF",
          200: "#FDD89E",
          300: "#FCBD5E",
          400: "#F5A623",
          500: "#E8920A",
          600: "#CC7A07",
          700: "#A86108",
          800: "#874D0B",
          900: "#6E3E0C",
        },
        // Semantic tokens driven by CSS vars — auto-adapt to .dark class
        accent:  "var(--color-accent)",
        dark:    "var(--color-dark)",
        surface: "var(--color-surface)",
        muted:   "var(--color-muted)",
        danger:  "var(--color-danger)",
        success: "var(--color-success)",
        border:  "var(--color-border)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
        modal: "0 20px 60px rgba(0,0,0,0.15)",
        glass: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
