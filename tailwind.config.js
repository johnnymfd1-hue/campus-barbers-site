/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'spartan': {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#18453B', // MSU Spartan Green - Primary
          600: '#153d34',
          700: '#12352d',
          800: '#0f2d26',
          900: '#0c251f',
        },
        'gold': {
          DEFAULT: '#C5A572', // Antique gold accent
          light: '#D4BC8E',
          dark: '#A68B5B',
        },
        'cream': '#F5F1E8',
        'charcoal': '#1A1A1A',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['Source Sans 3', 'Helvetica', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grain': "url('/noise.png')",
        'barber-pattern': "url('/barber-pattern.svg')",
      },
    },
  },
  plugins: [],
}
