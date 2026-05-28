import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        iris: {
          DEFAULT: "#6E5BFF",
          light: "#EEEDFF",
          glow: "#A58BFF",
          deep: "#4234B8",
          edge: "#8576FF",
        },
        electric: {
          DEFAULT: "#4DA3FF",
          soft: "#7FBDFF",
          deep: "#2E7BD6",
        },
        sky: "#4DA3FF",
        plum: "#A58BFF",
        noir: {
          0: "#07070B",
          1: "#0D0D14",
          2: "#13131D",
          3: "#1B1B26",
        },
        ink: {
          100: "#0A0A12",
          90: "#1B1B26",
          70: "#494956",
          50: "#7E7E8C",
          30: "#C7C7D0",
          15: "#E6E6EC",
          5: "#F6F6FA",
        },
        success: "#34D399",
        warning: "#F59E0B",
        error: "#F87171",
      },
      fontFamily: {
        display: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "sans-serif",
        ],
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        display: ["52px", { lineHeight: "1.12", letterSpacing: "-1.5px", fontWeight: "800" }],
        h1: ["32px", { lineHeight: "1.2", letterSpacing: "-0.5px", fontWeight: "800" }],
        h2: ["24px", { lineHeight: "1.3", letterSpacing: "-0.3px", fontWeight: "700" }],
        h3: ["18px", { lineHeight: "1.4", letterSpacing: "-0.1px", fontWeight: "700" }],
        price: ["34px", { lineHeight: "1.1", letterSpacing: "-0.5px", fontWeight: "800" }],
      },
      spacing: {
        "4.5": "18px",
        "9.5": "38px",
        "13": "52px",
        "18": "72px",
      },
      borderRadius: {
        "4xl": "22px",
      },
      letterSpacing: {
        eyebrow: "0.1em",
        tightish: "-0.3px",
        // Brand guide v1.0 typography tokens
        display: "-0.04em",
        body: "-0.01em",
        caption: "0.04em",
      },
      lineHeight: {
        body: "1.55",
      },
      backgroundImage: {
        "iris-grad":
          "linear-gradient(135deg, #6E5BFF 0%, #8576FF 50%, #4DA3FF 100%)",
        "iris-text":
          "linear-gradient(110deg, #C9C0FF 0%, #A58BFF 38%, #7FBDFF 72%, #4DA3FF 100%)",
        "iris-soft":
          "radial-gradient(60% 60% at 50% 0%, rgba(110,91,255,0.20) 0%, rgba(77,163,255,0.05) 55%, rgba(255,255,255,0) 80%)",
        "ink-soft":
          "radial-gradient(80% 60% at 50% 0%, rgba(110,91,255,0.18) 0%, rgba(7,7,11,0) 70%)",
        "hero-mesh":
          "radial-gradient(140% 80% at 18% 0%, rgba(110,91,255,0.32) 0%, rgba(110,91,255,0) 55%), radial-gradient(120% 80% at 100% 28%, rgba(77,163,255,0.22) 0%, rgba(77,163,255,0) 60%), radial-gradient(80% 60% at 50% 100%, rgba(66,52,184,0.35) 0%, rgba(66,52,184,0) 70%), linear-gradient(180deg, #07070B 0%, #0D0D14 60%, #07070B 100%)",
        "hero-beam":
          "linear-gradient(180deg, rgba(77,163,255,0) 0%, rgba(77,163,255,0.55) 40%, rgba(110,91,255,0.65) 65%, rgba(77,163,255,0) 100%)",
        "hero-bloom":
          "radial-gradient(50% 70% at 22% 36%, rgba(110,91,255,0.55) 0%, rgba(110,91,255,0) 65%)",
        "card-sheen":
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)",
        noise:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      keyframes: {
        "progress-pulse": {
          "0%": { width: "60%" },
          "100%": { width: "80%" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "beam-drift": {
          "0%, 100%": { opacity: "0.55", transform: "translateY(0)" },
          "50%": { opacity: "0.8", transform: "translateY(-6px)" },
        },
        "bloom-breathe": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.06)" },
        },
      },
      animation: {
        "progress-pulse": "progress-pulse 2s ease-in-out infinite alternate",
        "fade-up": "fade-up 0.5s ease both",
        "soft-pulse": "soft-pulse 2.4s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        "beam-drift": "beam-drift 8s ease-in-out infinite",
        "bloom-breathe": "bloom-breathe 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
