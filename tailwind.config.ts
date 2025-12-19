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
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'], // The Startup Font
        serif: ['Merriweather', 'serif'], // The Academic Font
      },
      colors: {
        border: "hsl(var(--border))",
        input: "#F1F5F9", // Light Grey for inputs
        ring: "#2563EB", // Blue ring on focus
        background: "#F8FAFC", // Off-white app bg
        foreground: "#334155", // Slate text
        
        // YOUR BRAND COLORS (Use these class names!)
        brand: {
          blue: "#2563EB", // Buttons & Links (Royal Blue)
          navy: "#0F172A", // Headings & Wallet (Deep Navy)
          pink: "#EC4899", // Accents
          success: "#10B981", // Badges
        },

        primary: {
          DEFAULT: "#2563EB", // Mapping primary to your Blue
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0F172A", // Mapping secondary to your Navy
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#EFF6FF", // Light blue background
          foreground: "#2563EB",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
        "xl": "20px", // Use rounded-xl for cards
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        'premium': '0px 4px 24px rgba(0, 0, 0, 0.06)', // The "Floaty" shadow
        'sticky': '0px -4px 20px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
