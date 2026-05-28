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
          50: "#EFEBFF",
          100: "#DDD5FF",
          200: "#BBA9FF",
          300: "#998AFF",
          400: "#7766FF",
          500: "#5B47FF",
          600: "#4632DB",
          700: "#3322B0",
          800: "#221780",
          900: "#150E55",
        },
        sky: {
          drift: "#7C9CFF",
        },
        plum: {
          halo: "#8A6CFF",
        },
        ink: {
          "05": "#F6F6FA",
          "15": "#E6E6EC",
          "30": "#C7C7D0",
          "50": "#7E7E8C",
          "70": "#494956",
          "90": "#1B1B26",
          "100": "#0A0A12",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "Pretendard Variable",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        meta: "0.18em",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(10,10,18,0.04), 0 8px 24px rgba(10,10,18,0.04)",
        lift: "0 10px 40px -10px rgba(91,71,255,0.25)",
        ring: "0 0 0 1px rgba(10,10,18,0.06)",
      },
      backgroundImage: {
        "iris-grad":
          "linear-gradient(135deg, #5B47FF 0%, #7C9CFF 60%, #8A6CFF 100%)",
        "soft-grad":
          "radial-gradient(60% 50% at 50% 0%, rgba(91,71,255,0.18) 0%, rgba(124,156,255,0.06) 45%, rgba(255,255,255,0) 80%)",
        grid:
          "linear-gradient(rgba(10,10,18,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,18,0.05) 1px, transparent 1px)",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 2.6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        shimmer: "shimmer 2.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
