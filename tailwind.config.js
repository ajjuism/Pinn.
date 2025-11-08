/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'theme-bg-primary': 'var(--color-bg-primary)',
        'theme-bg-secondary': 'var(--color-bg-secondary)',
        'theme-bg-tertiary': 'var(--color-bg-tertiary)',
        'theme-bg-darker': 'var(--color-bg-darker)',
        'theme-bg-darkest': 'var(--color-bg-darkest)',
        'theme-border': 'var(--color-border)',
        'theme-border-light': 'var(--color-border-light)',
        'theme-text-primary': 'var(--color-text-primary)',
        'theme-text-secondary': 'var(--color-text-secondary)',
        'theme-text-tertiary': 'var(--color-text-tertiary)',
        'theme-accent': 'var(--color-accent)',
        'theme-accent-hover': 'var(--color-accent-hover)',
      },
    },
  },
  plugins: [],
};
