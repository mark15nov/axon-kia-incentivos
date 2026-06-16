/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kia: {
          black: '#05141F',
          ink: '#0B1B26',
          red: '#BB162B',
          'red-soft': '#E4002B',
          gray: '#64748B',
          line: '#E6E9EC',
          bg: '#F6F7F8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(5,20,31,0.04), 0 8px 24px rgba(5,20,31,0.06)',
        pop: '0 12px 40px rgba(5,20,31,0.12)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'bar-fill': {
          '0%': { width: '0%' }
        }
      },
      animation: {
        'fade-up': 'fade-up .4s ease both'
      }
    }
  },
  plugins: []
}
