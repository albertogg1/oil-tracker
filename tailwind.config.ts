import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#F5F5F7',
          surface: '#FFFFFF',
          gray1: '#8E8E93',
          gray2: '#AEAEB2',
          gray3: '#C7C7CC',
          blue: '#007AFF',
          green: '#34C759',
          yellow: '#FF9500',
          red: '#FF3B30',
        },
      },
      borderRadius: {
        card: '18px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 2px 20px rgba(0,0,0,0.07)',
        'card-hover': '0 4px 30px rgba(0,0,0,0.12)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
