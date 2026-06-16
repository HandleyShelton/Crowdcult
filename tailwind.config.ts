import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0c0c0c',
        'surface-2': '#181818',
        accent: '#e50914',
        'accent-hover': '#c1070f',
      },
      fontFamily: {
        sans: ['"Space Mono"', '"Courier New"', 'monospace'],
        mono: ['"Space Mono"', '"Courier New"', 'monospace'],
        display: ['"Bebas Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
