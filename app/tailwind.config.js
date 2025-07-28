/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#121212",
        secondary: "#16a34a",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [require("tailwindcss-animate")],
};
