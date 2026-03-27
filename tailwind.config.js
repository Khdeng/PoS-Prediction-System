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
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        surface: '#FFFFFF',
        background: '#F8FAFC',
      },
      animation: {
        'pulse-slow': 'pulse 1.5s ease-in-out infinite',
        'float-up': 'floatUp 400ms ease-out forwards',
        'slide-in-right': 'slideInRight 200ms ease-out',
        'slide-out-left': 'slideOutLeft 150ms ease-in forwards',
        'scale-in': 'scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
      },
    },
  },
  plugins: [],
};
