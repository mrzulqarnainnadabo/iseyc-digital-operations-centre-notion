/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#123b2f",
          900: "#123b2f",
          800: "#194b3b",
          100: "#e8f0ea",
        },
        cream: { 50: "#faf9f5" },
        ink: {
          950: "#202923",
          700: "#626d65",
          600: "#626d65",
        },
        gold: { 700: "#755f27", 600: "#a7833f" },
        line: "#e4e6df",
        success: { DEFAULT: "#28664a", 50: "#edf4ef", 200: "#c7d9cd" },
        warning: { DEFAULT: "#93651d", 50: "#fbf6ec", 200: "#e6d2aa" },
        danger: { DEFAULT: "#a43d37", 50: "#fbf1f0", 200: "#e9bfbb" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: { card: "var(--shadow-card)" },
      borderRadius: { card: "var(--radius-card)", control: "var(--radius-control)" },
      minHeight: { touch: "44px" },
    },
  },
  plugins: [],
};
