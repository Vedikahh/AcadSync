/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        background: "var(--bg-page)",
        card: "var(--bg-card)",
        "card-2": "var(--bg-card-2)",
        sidebar: "var(--bg-sidebar)",
        navbar: "var(--bg-navbar)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        blue: {
          50: "var(--blue-50)",
          100: "var(--blue-100)",
          500: "var(--blue-500)",
          600: "var(--blue-600)",
          700: "var(--blue-700)",
        },
        indigo: {
          50: "var(--indigo-50)",
          100: "var(--indigo-100)",
          500: "var(--indigo-500)",
          600: "var(--indigo-600)",
        },
        green: {
          50: "var(--green-50)",
          500: "var(--green-500)",
          600: "var(--green-600)",
        },
        red: {
          50: "var(--red-50)",
          500: "var(--red-500)",
          600: "var(--red-600)",
        },
        orange: {
          50: "var(--orange-50)",
          500: "var(--orange-500)",
        },
        yellow: {
          500: "var(--yellow-500)",
        },
        purple: {
          500: "var(--purple-500)",
        }
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        card: "var(--shadow-card)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        glow: "0 0 20px rgba(99, 102, 241, 0.4)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        slideUp: 'slideUp 0.5s ease-out forwards',
        slideDown: 'slideDown 0.5s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 3s ease-in-out infinite',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      transitionTimingFunction: {
        'fast': 'ease-out',
        'normal': 'ease-in-out',
        'slow': 'ease-in',
      }
    },
  },
  plugins: [],
}