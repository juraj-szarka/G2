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
          50: "#ECFDF3",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857"
        }
      },
      fontFamily: {
        sans: ["System"]
      }
    }
  },
  plugins: []
};
