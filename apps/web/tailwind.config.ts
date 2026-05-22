import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          500: '#4f6ef7',
          600: '#3d5ce8',
          900: '#1a2a6c',
        },
      },
    },
  },
} satisfies Config;
