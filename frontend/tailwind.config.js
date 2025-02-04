/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'mobile': '0px',
      'desktop': '601px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB", // Bleu principal
          dark: "#1E40AF", // Bleu foncé
        },
        secondary: {
          DEFAULT: "#059669", // Vert principal
          dark: "#047857", // Vert foncé
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out'
      }
    },
  },
  plugins: [],
};
