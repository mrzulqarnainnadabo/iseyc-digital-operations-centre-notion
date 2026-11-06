/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "var(--iseyc-forest-950)",
          900: "var(--iseyc-forest-900)",
          800: "var(--iseyc-forest-800)",
          100: "var(--iseyc-forest-100)",
        },
        cream: { 50: "var(--iseyc-cream-50)" },
        ink: {
          950: "var(--iseyc-ink-950)",
          700: "var(--iseyc-ink-700)",
          600: "var(--iseyc-ink-600)",
        },
        gold: { 600: "var(--iseyc-gold-600)" },
        line: "var(--iseyc-border)",
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
