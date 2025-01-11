/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'figma-bg': 'var(--figma-color-bg)',
        'figma-bg-hover': 'var(--figma-color-bg-hover)',
        'figma-bg-active': 'var(--figma-color-bg-pressed)',
        'figma-bg-secondary': 'var(--figma-color-bg-secondary)',
        'figma-border': 'var(--figma-color-border)',
        'figma-text': 'var(--figma-color-text)',
        'figma-text-secondary': 'var(--figma-color-text-secondary)',
      },
    },
  },
  plugins: [],
}