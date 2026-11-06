/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#102f26",
          900: "#123b2f",
          800: "#194b3b",
          100: "#e8f0ea",
        },
        cream: { 50: "#faf9f5" },
        ink: {
          950: "#202923",
          700: "#48544c",
          600: "#626d65",
        },
        gold: { 600: "#80621f" },
        line: "#e4e6df",
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
