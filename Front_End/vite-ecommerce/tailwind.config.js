/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#007185",
        "primary-hover": "#005F70",
        "text-main": "#333333",
        "text-secondary": "#565959",
        "text-muted": "#767676",
        price: "#B12704",
        accent: "#FFA41C",
        "bg-light": "#F5F7F9",
        "bg-dark": "#232F3E",
        "border-default": "#D5D9D9",
        "status-success": "#067D62",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "cart-bounce": "cartBounce 0.5s ease",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        cartBounce: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
      },
    },
  },
  plugins: [],
};
