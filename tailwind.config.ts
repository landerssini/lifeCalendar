import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        posterRed: "#8f1217",
        paperWhite: "#fff8f0",
        ink: "#250507"
      },
      boxShadow: {
        poster: "0 30px 90px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
