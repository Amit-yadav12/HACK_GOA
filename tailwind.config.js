/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#f7f6f1',
        paper: '#fffefa',
        navy: '#173247',
        ink: '#2c3e4b',
        muted: '#5f6f79',
        line: '#e5e5de',
        teal: '#116c69',
        'teal-soft': '#e7f2ef',
        amber: '#8d5b1c',
        'amber-soft': '#fbf1df',
        danger: '#963e3a',
        'danger-soft': '#faece9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['"SFMono-Regular"', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      boxShadow: {
        paper: '0 12px 40px rgba(23, 50, 71, 0.055)',
        lift: '0 16px 32px rgba(23, 50, 71, 0.12)',
      },
    },
  },
  plugins: [],
};
