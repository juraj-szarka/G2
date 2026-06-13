/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111812",
        muted: "#6B746E",
        paper: "#F7FAF7",
        line: "#E4EBE5",
        emerald: {
          50: "#E6FFE6",
          100: "#B3FFB3",
          500: "#00E500",
          600: "#00CC00",
          700: "#009900"
        }
      },
      fontFamily: {
        sans: ["System"]
      }
    }
  },
  plugins: []
};
