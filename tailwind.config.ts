import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Poppins", "sans-serif"],
        mono: ["var(--font-sans)", "Poppins", "sans-serif"],
      },
      colors: {
        // Base (Dark Foundation)
        black: "#000000",
        bg: {
          0: "#000000",       // raiz
          1: "#0B0B0C",       // principal
          2: "#121214",       // sidebar / header
          3: "#1C1C1F",       // cards / superfícies
          4: "#2A2A2E",       // bordas / divisores
          5: "#35353A",       // hover sutil
        },
        // Gold System
        gold: {
          DEFAULT: "#D6C2A1", // champagne gold — ações primárias
          hover:   "#BFA888", // hover
          dark:    "#8F7A5C", // detalhes
          muted:   "rgba(214,194,161,0.10)",
          border:  "rgba(214,194,161,0.18)",
        },
        // Text
        text: {
          primary:   "#FFFFFF",
          secondary: "#A1A1AA",
          muted:     "#6B6B73",
        },
        // Nova (primary action — orange/amber)
        nova: {
          DEFAULT: "#E07B30",
          hover:   "#C86820",
          muted:   "rgba(224,123,48,0.10)",
          border:  "rgba(224,123,48,0.20)",
        },
        // AI Accent (usar com parcimônia — max 5%)
        ai: {
          blue:  "#5B8CFF",
          green: "#7CFFB2",
        },
        // Semântica de estado
        success: { DEFAULT: "#7CFFB2", muted: "rgba(124,255,178,0.10)" },
        warning: { DEFAULT: "#F5C842", muted: "rgba(245,200,66,0.10)" },
        danger:  { DEFAULT: "#FF5C5C", muted: "rgba(255,92,92,0.10)" },
        // Bordas
        border: {
          subtle:  "rgba(255,255,255,0.04)",
          DEFAULT: "rgba(255,255,255,0.07)",
          strong:  "rgba(255,255,255,0.12)",
          gold:    "rgba(214,194,161,0.18)",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      letterSpacing: {
        widest: "0.2em",
        wider: "0.12em",
      },
    },
  },
};

export default config;
