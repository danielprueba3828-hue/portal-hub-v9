/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marathon: {
          deep: '#1A3A6B',
          medium: '#2563EB',
          light: '#DBEAFE',
          extralight: '#EFF6FF',
          red: '#DC2626',
          text: '#1E293B',
          gray: '#F1F5F9',
        },
      },
      fontFamily: {
        title: ['Outfit', 'sans-serif'],
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
