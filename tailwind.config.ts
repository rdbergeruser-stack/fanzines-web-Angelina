import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f5',
          100: '#fbe8eb',
          200: '#f7d5da',
          300: '#f0b4bd',
          400: '#e68595',
          500: '#d9536f',
          600: '#c43755',
          700: '#a52843',
          800: '#89243b',
          900: '#752236',
        }
      }
    },
  },
  plugins: [],
};
export default config;
