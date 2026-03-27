/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0F0D1B',
        surface: {
          DEFAULT: '#1A1727',
          light: '#252236',
        },
        primary: {
          DEFAULT: '#7C5CFC',
          light: '#A78BFA',
        },
        aura: {
          text: '#EEEDF2',
          muted: '#8B8A93',
          border: '#2D2A3E',
          error: '#EF4444',
        },
      },
      fontSize: {
        'aura-sm': ['14px', { lineHeight: '20px' }],
        'aura-md': ['16px', { lineHeight: '24px' }],
        'aura-lg': ['20px', { lineHeight: '28px' }],
        'aura-xl': ['28px', { lineHeight: '36px' }],
        'aura-2xl': ['36px', { lineHeight: '44px' }],
      },
      borderRadius: {
        'aura-sm': '8px',
        'aura-md': '12px',
        'aura-lg': '16px',
      },
      spacing: {
        'aura-xs': '4px',
        'aura-sm': '8px',
        'aura-md': '16px',
        'aura-lg': '24px',
        'aura-xl': '32px',
        'aura-2xl': '48px',
      },
    },
  },
  plugins: [],
}