/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        md: "768px", // Mobile vers tablette
        lg: "1024px", // Tablette vers desktop
      },
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
    },
  },
  plugins: [],
};
