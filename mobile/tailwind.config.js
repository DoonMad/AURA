/** @type {import('tailwindcss').Config} */
export default {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        surface: {
          DEFAULT: '#18181B',
          light: '#27272A',
          lighter: '#3F3F46',
        },
        primary: {
          DEFAULT: '#F4F4F5',
          dark: '#A1A1AA',
        },
        aura: {
          text: '#FAFAFA',
          muted: '#71717A',
          border: '#27272A',
          error: '#EF4444',
          active: '#22C55E',   // Green for speaking state
          standby: '#EAB308',  // Yellow/Orange for connecting/wait state
          danger: '#EF4444',   // Red for disconnect/error
        },
      },
      fontSize: {
        'aura-sm': ['14px', { lineHeight: '20px' }],
        'aura-md': ['16px', { lineHeight: '24px' }],
        'aura-lg': ['20px', { lineHeight: '28px' }],
        'aura-xl': ['28px', { lineHeight: '36px' }],
        'aura-2xl': ['40px', { lineHeight: '48px', fontWeight: '800' }],
      },
      borderRadius: {
        'aura-sm': '8px',
        'aura-md': '12px',
        'aura-lg': '16px',
        'aura-full': '9999px',
      },
      spacing: {
        'aura-xs': '4px',
        'aura-sm': '8px',
        'aura-md': '16px',
        'aura-lg': '24px',
        'aura-xl': '32px',
        'aura-2xl': '48px',
      },
      boxShadow: {
        'glow-active': '0 0 20px rgba(34, 197, 94, 0.5)',
        'glow-standby': '0 0 20px rgba(234, 179, 8, 0.5)',
      }
    },
  },
  plugins: [],
}