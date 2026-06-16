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
        background: '#1a1b26',
        surface: '#1f2335',
        'surface-2': '#292e42',
        line: '#2e3450',
        ink: '#c0caf5',
        muted: '#565f89',
        accent: '#bb9af7',
        'accent-hover': '#9d7cd8',
        cyan: '#7dcfff',
        green: '#9ece6a',
        pink: '#f7768e',
        yellow: '#e0af68',
      },
      fontFamily: {
        sans: ['"Space Mono"', '"Courier New"', 'monospace'],
        mono: ['"Space Mono"', '"Courier New"', 'monospace'],
        display: ['"Pixelify Sans"', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
