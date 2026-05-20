/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        "cruz-verde": { DEFAULT: "#00963f", light: "#e6f5ec" },
        salcobrand:   { DEFAULT: "#003087", light: "#e6eaf5" },
        ahumada:      { DEFAULT: "#e31837", light: "#fde8eb" },
        "dr-simi":    { DEFAULT: "#e2001a", light: "#fff0f0" },
        best: "#16a34a",
      },
    },
  },
  plugins: [],
};
