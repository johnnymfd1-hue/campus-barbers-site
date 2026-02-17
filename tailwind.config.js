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
        'noir': {
          50: '#2a2025',
          100: '#231b20',
          200: '#1d161a',
          300: '#170f14',
          400: '#120b0e',
          500: '#0D0709', // Near-black with warm undertone
          600: '#0a0507',
          700: '#070305',
          800: '#040203',
          900: '#020101',
        },
        'crimson': {
          DEFAULT: '#8B1A2B', // Deep burgundy/crimson
          light: '#A62639',
          dark: '#6B1321',
          glow: '#C2185B',
        },
        'rose-gold': {
          DEFAULT: '#C5A880', // Warm rose gold
          light: '#D4BC9A',
          dark: '#A68B5B',
        },
        'velvet': '#2A0A14', // Deep velvet red-black
        'smoke': '#1A1118', // Smoky dark
        'ivory': '#F0E6D6', // Warm ivory for text
        'blush': '#E8C4B0', // Soft blush accent
        // Keep legacy names for components that still reference them
        'spartan': {
          500: '#0D0709',
          600: '#070305',
        },
        'gold': {
          DEFAULT: '#C5A880',
          light: '#D4BC9A',
          dark: '#A68B5B',
        },
        'cream': '#F0E6D6',
        'charcoal': '#0D0709',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['Source Sans 3', 'Helvetica', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grain': "url('/noise.png')",
      },
      boxShadow: {
        'glow': '0 0 40px rgba(139, 26, 43, 0.3)',
        'glow-gold': '0 0 40px rgba(197, 168, 128, 0.2)',
        'inner-glow': 'inset 0 0 60px rgba(139, 26, 43, 0.1)',
      },
    },
  },
  plugins: [],
}
