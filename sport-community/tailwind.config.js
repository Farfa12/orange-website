/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Charte Sport Community
        primary: {
          DEFAULT: '#10B981', // Vert émeraude
          dark: '#059669',
          light: '#D1FAE5',
        },
        night: {
          DEFAULT: '#0F172A', // Bleu nuit (structure / fond sombre)
          soft: '#1E293B',
          line: '#334155',
        },
        cta: {
          DEFAULT: '#F97316', // Orange (réserver, s'inscrire, promos)
          dark: '#EA580C',
          light: '#FFEDD5',
        },
        surface: '#F8FAFC', // Fond clair
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  plugins: [],
}
