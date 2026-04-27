import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pharmacy: {
          green: "#16a34a",
          "green-dark": "#15803d",
          "green-light": "#dcfce7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
