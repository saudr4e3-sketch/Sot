/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Carbon Black & Deep Navy - Background (MASTER DIRECTIVE)
        'dark-bg': '#0F1419',
        'dark-bg-alt': '#1A1F2E',
        'dark-card': '#2C2C3E',
        // Muted Terracotta - Primary Action (MASTER DIRECTIVE)
        'accent-terracotta': '#D4714D',
        'accent-terracotta-hover': '#E88561',
        'accent-terracotta-dark': '#C0614A',
        // Champagne Gold - Secondary
        'accent-gold': '#D4AF9F',
        'accent-gold-hover': '#E0BEAF',
        // Text Colors
        'text-primary': '#E8E8E8',
        'text-secondary': '#A0A0A0',
        'text-muted': '#6B6B7F',
        // Status Colors
        'status-success': '#4CAF50',
        'status-error': '#F44336',
        'status-warning': '#FF9800',
        'status-info': '#2196F3',
      },
      fontFamily: {
        'arabic': ['Cairo', 'Dosis', 'sans-serif'],
        'sans': ['Segoe UI', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'input': '8px',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 24px rgba(212, 113, 77, 0.2)',
        'btn': '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'pulse-terracotta': 'pulse-terracotta 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'bounce-auction': 'bounce-auction 0.6s ease-in-out',
      },
      keyframes: {
        'pulse-terracotta': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-in': {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'bounce-auction': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
