/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Every token below is backed by a CSS variable (space-separated
        // RGB) defined in globals.css, with dark values as the :root
        // default and a `.light` class overriding them — see globals.css.
        // The rgb(var(...) / <alpha-value>) form keeps opacity modifiers
        // (e.g. bg-surface/95) working exactly like plain colors do.
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          soft: "rgb(var(--color-ink-soft) / <alpha-value>)",
        },
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          strong: "rgb(var(--color-border-strong) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          dark: "rgb(var(--color-accent-dark) / <alpha-value>)",
          light: "rgb(var(--color-accent-light) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          light: "rgb(var(--color-danger-light) / <alpha-value>)",
        },
        like: {
          DEFAULT: "rgb(var(--color-like) / <alpha-value>)",
          light: "rgb(var(--color-like-light) / <alpha-value>)",
        },
        category: {
          share: "rgb(var(--color-category-share) / <alpha-value>)",
          "share-bg": "rgb(var(--color-category-share-bg) / <alpha-value>)",
          sell: "rgb(var(--color-category-sell) / <alpha-value>)",
          "sell-bg": "rgb(var(--color-category-sell-bg) / <alpha-value>)",
          collab: "rgb(var(--color-category-collab) / <alpha-value>)",
          "collab-bg": "rgb(var(--color-category-collab-bg) / <alpha-value>)",
          idea: "rgb(var(--color-category-idea) / <alpha-value>)",
          "idea-bg": "rgb(var(--color-category-idea-bg) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.16), 0 1px 1px rgb(0 0 0 / 0.12)",
        "card-hover": "0 8px 20px -6px rgb(0 0 0 / 0.35)",
        popover: "0 12px 32px -8px rgb(0 0 0 / 0.5)",
      },
      keyframes: {
        "overlay-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "overlay-out": { from: { opacity: 1 }, to: { opacity: 0 } },
        "content-in": {
          from: { opacity: 0, transform: "translate(-50%, -46%) scale(0.96)" },
          to: { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
        },
        "content-out": {
          from: { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: 0, transform: "translate(-50%, -47%) scale(0.97)" },
        },
        "menu-in": {
          from: { opacity: 0, transform: "translateY(-4px) scale(0.97)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "overlay-in": "overlay-in 200ms ease-out",
        "overlay-out": "overlay-out 150ms ease-in forwards",
        "content-in": "content-in 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "content-out": "content-out 160ms cubic-bezier(0.4, 0, 1, 1) forwards",
        "menu-in": "menu-in 140ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};
