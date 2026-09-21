/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gaming-dark': '#0b0f19',    
        'gaming-card': '#1a2235',    
        'neon-purple': '#b535f6',    
        'neon-blue': '#2bf2fb',      
        'neon-pink': '#ff2a6d',      
      },
      boxShadow: {
        'neon-purple': '0 0 10px #b535f6, 0 0 20px #b535f6',
        'neon-blue': '0 0 10px #2bf2fb, 0 0 20px #2bf2fb',
      }
    },
  },
  plugins: [],
}