/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#FFFAEF',
          card: '#FFFAEF',
          line: '#342C21',
        },
        ink: {
          primary: '#342C21',
          secondary: '#655E51',
          accent: '#237E7F',
        },
        tape: {
          yellow: '#F5D76E',
          mint: '#E8EFDA',
          coral: '#F5A89B',
        },
      },
      fontFamily: {
        sans: ['Paperlogy', 'system-ui', '-apple-system', 'sans-serif'],
        hand: ['Paperlogy', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '3px 3px 0 #342C21',
        'paper-lg': '7px 7px 0 #237E7F',
      },
      borderRadius: {
        paper: '14px',
      },
    },
  },
  plugins: [],
};
