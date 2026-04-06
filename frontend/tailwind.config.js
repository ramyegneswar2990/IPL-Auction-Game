/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        primary: 'hsl(var(--primary))',
        accent: 'hsl(var(--accent))',
        sold: 'hsl(var(--sold))',
        destructive: 'hsl(var(--destructive))',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px hsl(var(--primary) / 0.25)',
        glowGold: '0 0 30px hsl(var(--accent) / 0.22)',
        glowGreen: '0 0 30px hsl(var(--sold) / 0.22)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-3px)' },
          '40%': { transform: 'translateX(3px)' },
          '60%': { transform: 'translateX(-2px)' },
          '80%': { transform: 'translateX(2px)' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.25))' },
          '50%': { filter: 'drop-shadow(0 0 18px hsl(var(--primary) / 0.35))' },
        },
      },
      animation: {
        shake: 'shake 0.35s ease-in-out infinite',
        pulseSoft: 'pulseSoft 0.8s ease-in-out infinite',
        glow: 'glow 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

