/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#FAF6EE',
          card: '#FFFCF5',
          line: '#E8DFD0',
        },
        ink: {
          primary: '#3D2E1F',
          secondary: '#6B5B47',
          accent: '#D4574E',
        },
        tape: {
          yellow: '#F5D76E',
          mint: '#A8D8C8',
          coral: '#F5A89B',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
        hand: ['Gaegu', 'cursive'],
      },
      boxShadow: {
        paper: '2px 3px 0 rgba(0,0,0,0.08)',
        'paper-lg': '3px 5px 0 rgba(0,0,0,0.10)',
      },
      borderRadius: {
        paper: '6px',
      },
    },
  },
  plugins: [],
};
