/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        showroom: {
          dark: '#0f172a',     // slate-900
          card: '#1e293b',     // slate-800
          border: '#334155',   // slate-700
          primary: '#6366f1',  // indigo-500
          primaryHover: '#4f46e5', // indigo-600
          accent: '#06b6d4',   // cyan-500
          textPrimary: '#f8fafc',
          textSecondary: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
