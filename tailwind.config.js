/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["\"IBM Plex Sans\"", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "monospace"],
      },
      colors: {
        ink: {
          900: "#0b0d12",
          800: "#111827",
          700: "#1f2937",
          400: "#9ca3af",
          300: "#d1d5db",
          200: "#e5e7eb",
        },
        sunrise: {
          500: "#ff7a59",
          400: "#ff9e7a",
        },
        ocean: {
          500: "#1a7f8c",
          400: "#2ab0c4",
        },
        dusk: {
          500: "#6d4cff",
          400: "#8a73ff",
        },
      },
      boxShadow: {
        glow: "0 20px 60px -25px rgba(15, 23, 42, 0.65)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        rise: {
          "0%": { transform: "translateY(16px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        rise: "rise 0.6s ease-out both",
      },
    },
  },
  plugins: [],
}
