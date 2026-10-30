/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080b10",
        panel: "#10151d",
        line: "#222b37",
        signal: "#6ee7c7",
      },
      boxShadow: {
        glow: "0 0 45px rgba(110, 231, 199, 0.12)",
      },
    },
  },
  plugins: [],
};
