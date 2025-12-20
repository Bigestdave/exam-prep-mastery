import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
      colors: {
        border: "#E2E8F0",
        input: "#F1F5F9",
        ring: "#3B82F6",
        background: "#F8FAFC",
        foreground: "#1E293B", // Softer Navy (Slate-800)
        
        // MODERN PALETTE
        primary: {
          DEFAULT: "#4F46E5", // Indigo-600 (Much more premium than basic blue)
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1E293B", // Slate-800
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#EEF2FF", // Indigo-50
          foreground: "#4F46E5",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1E293B",
        },
        // CUSTOM
        navy: {
          DEFAULT: "#0F172A",
          light: "#334155",
        },
        success: {
          DEFAULT: "#059669", // Emerald-600
          light: "#D1FAE5",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
        "xl": "20px",
        "2xl": "24px",
      },
      boxShadow: {
        'premium': '0px 2px 8px -2px rgba(0, 0, 0, 0.05), 0px 4px 16px rgba(0, 0, 0, 0.02)', // Softer shadow
        'float': '0px 20px 40px -4px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        }
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
