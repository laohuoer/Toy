/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        fridge: {
          metal: '#c8d6e5',
          dark: '#2c3e50',
          shine: '#ecf0f1',
        },
        rarity: {
          common: '#9ca3af',
          rare: '#3b82f6',
          epic: '#8b5cf6',
          legendary: '#f59e0b',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gacha-shake': 'gachaShake 0.5s ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(251, 191, 36, 0.5)' },
          '50%': { boxShadow: '0 0 25px rgba(251, 191, 36, 0.9), 0 0 50px rgba(251, 191, 36, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gachaShake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
      },
      backgroundImage: {
        'metal-gradient': 'linear-gradient(135deg, #c8d6e5 0%, #a8b8c8 25%, #d4e0ec 50%, #9aabbb 75%, #c0d0e0 100%)',
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.4) 50%, transparent 100%)',
      },
      boxShadow: {
        'badge': '2px 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
        'badge-hover': '4px 8px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
        'fridge': 'inset 0 2px 10px rgba(0,0,0,0.2), inset 0 -2px 10px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
