import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./frontend/index.html', './frontend/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e7ff',
          200: '#b0cfff',
          300: '#85b4ff',
          400: '#5594ff',
          500: '#2563eb',
          600: '#1d4fd7',
          700: '#1b3fb1',
          800: '#19358d',
          900: '#162d70',
          950: '#0f1c45',
        },
      },
      boxShadow: {
        'elevated-lg': '0 18px 45px rgba(15, 23, 42, 0.12)',
        'elevated-sm': '0 12px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
