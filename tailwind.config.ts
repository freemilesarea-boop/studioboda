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
          DEFAULT: "#5B47FF",
          light: "#EEEDFF",
          glow: "#8C7CFF",
          deep: "#3D2DE5",
        },
        sky: "#7C9CFF",
        plum: "#8A6CFF",
        ink: {
          100: "#0A0A12",
          90: "#181826",
          70: "#494956",
          50: "#7E7E8C",
          30: "#C6C7D0",
          15: "#E6E6EC",
          5: "#F6F6FA",
        },
        success: "#4ADE80",
        warning: "#F59E0B",
        error: "#F87171",
      },
      fontFamily: {
        display: [
          "Plus Jakarta Sans",
          "Noto Sans KR",
          "Apple SD Gothic Neo",
          "Pretendard",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Noto Sans KR",
          "Plus Jakarta Sans",
          "Apple SD Gothic Neo",
          "Pretendard",
          "system-ui",
          "sans-serif",
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
      },
      backgroundImage: {
        "iris-grad":
          "linear-gradient(135deg, #5B47FF 0%, #8C7CFF 55%, #8A6CFF 100%)",
        "iris-text":
          "linear-gradient(120deg, #8C7CFF 0%, #B5A8FF 50%, #7C9CFF 100%)",
        "iris-soft":
          "radial-gradient(60% 60% at 50% 0%, rgba(91,71,255,0.22) 0%, rgba(124,156,255,0.05) 55%, rgba(255,255,255,0) 80%)",
        "ink-soft":
          "radial-gradient(80% 60% at 50% 0%, rgba(91,71,255,0.20) 0%, rgba(10,10,18,0) 70%)",
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
      },
      animation: {
        "progress-pulse": "progress-pulse 2s ease-in-out infinite alternate",
        "fade-up": "fade-up 0.5s ease both",
        "soft-pulse": "soft-pulse 2.4s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
