import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0e7490', light: '#06b6d4', dark: '#164e63' },
        fb: '#1877F2',
        line: '#06C755',
      },
      fontFamily: {
        thai: ['IBM Plex Sans Thai', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
