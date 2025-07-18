/** @type {import('tailwindcss').Config} */
module.exports = {
  // Dark mode is handled by adding 'dark' class to body in index.html
  darkMode: 'class', // Keep this as 'class' for consistency, though we'll force it
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Palette based on provided images
        'dark-bg': '#1A1A1A',        // Very dark background
        'dark-card': '#242424',      // Slightly lighter dark for cards/sections
        'accent-green': '#00E676',   // Vibrant green for CTAs, icons, highlights
        'text-light': '#FFFFFF',     // White for primary text
        'text-secondary': '#A0AEC0', // Light grey for secondary text

        // Functional colors (keep for alerts)
        'error-red': '#EF4444',
        'success-green': '#22C55E',
        'warning-orange': '#F97316',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Set Inter as the primary font
      },
      boxShadow: {
        // Subtle shadows for cards and elements
        'custom-light': '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'custom-medium': '0 10px 15px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        // Subtle pulse for interactive elements
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 1.5s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}