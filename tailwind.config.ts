import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Poppins", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Playfair Display", "serif"],
        mono: ["var(--font-mono)", "DM Mono", "monospace"],
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
        // Gold / Amber — accent, autoridade, dados
        gold: {
          DEFAULT: "#F4C430",
          hover:   "#E0B020",
          dark:    "#B8901E",
          muted:   "rgba(244,196,48,0.10)",
          border:  "rgba(244,196,48,0.22)",
        },
        amber: {
          DEFAULT: "#F4C430",
          hover:   "#E0B020",
          dark:    "#B8901E",
          glow:    "rgba(244,196,48,0.18)",
        },
        // Text
        text: {
          primary:   "#FFFFFF",
          secondary: "#A1A1AA",
          muted:     "#6B6B73",
        },
        // Nova / Ember — laranja, acao, CTA
        nova: {
          DEFAULT: "#FF8A1F",
          hover:   "#E5740F",
          muted:   "rgba(255,138,31,0.10)",
          border:  "rgba(255,138,31,0.22)",
        },
        ember: {
          DEFAULT: "#FF8A1F",
          hover:   "#E5740F",
          deep:    "#C2410C",
        },
        // Verde — sucesso, ativo, positivo
        success: { DEFAULT: "#34D399", muted: "rgba(52,211,153,0.10)" },
        // Semantica (usa as 3 cores base)
        warning: { DEFAULT: "#F4C430", muted: "rgba(244,196,48,0.10)" },
        danger:  { DEFAULT: "#FF5C5C", muted: "rgba(255,92,92,0.10)" },
        // Bordas
        border: {
          subtle:  "rgba(255,180,100,0.04)",
          DEFAULT: "rgba(255,180,100,0.07)",
          strong:  "rgba(255,180,100,0.12)",
          gold:    "rgba(244,196,48,0.22)",
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
