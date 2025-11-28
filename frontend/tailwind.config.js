/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ▼ ここに colors があるか確認
      colors: {
        dark: '#0a0a0a', 
        surface: '#171717',
        primary: colors.lime,
      },
    },
  },
  plugins: [],
}