/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#d4410b',
        'accent-light': '#fff1ec',
        'accent-border': '#f8c5b0',
        muted: '#7a7670',
        surface: '#eeecea',
        border: '#e2dfd9',
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
