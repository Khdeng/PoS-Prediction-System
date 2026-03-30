/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          light: '#EFF6FF',
          dark: '#1E40AF',
        },
        surface: '#FFFFFF',
        background: '#F8FAFC',
        navy: {
          900: '#0B1121',
          800: '#0F172A',
          700: '#1E293B',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'float-up': 'floatUp 400ms ease-out forwards',
        'slide-in-right': 'slideInRight 200ms ease-out',
        'slide-out-left': 'slideOutLeft 150ms ease-in forwards',
        'scale-in': 'scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'expand-down': 'expandDown 250ms ease-out forwards',
        'fade-in': 'fadeIn 200ms ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(-20px)' },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(16px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        slideOutLeft: {
          '0%': { opacity: 1, transform: 'translateX(0)' },
          '100%': { opacity: 0, transform: 'translateX(-16px)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.5)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        expandDown: {
          '0%': { opacity: 0, maxHeight: 0 },
          '100%': { opacity: 1, maxHeight: '300px' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59,130,246,0.3)' },
          '100%': { boxShadow: '0 0 15px rgba(59,130,246,0.5)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(59,130,246,0.15)',
        'glow': '0 0 15px rgba(59,130,246,0.2)',
        'glow-lg': '0 0 25px rgba(59,130,246,0.25)',
      },
    },
  },
  plugins: [],
};
