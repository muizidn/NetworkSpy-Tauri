/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'table-header': '#23262a',
        button: {
          bg: 'var(--button-bg-color)',
          text: 'var(--button-text-color)',
          hover: 'var(--button-hover-bg-color)',
        },
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['hover'],
    },
  },
  daisyui: {
    themes: [
      "dark",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
    ],
  },
  plugins: [
    require("@tailwindcss/typography"), 
    require("daisyui"),
    require("@tailwindcss/container-queries")
  ],
};
