// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/components/**/*.{js,ts,jsx,tsx}", "./src/app/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				bg: "rgb(var(--color-bg-rgb) / <alpha-value>)",
				primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
				secondary: "rgb(var(--color-secondary-rgb) / <alpha-value>)",
				highlight: "rgb(var(--color-highlight-rgb) / <alpha-value>)",
				text: "rgb(var(--color-text-rgb) / <alpha-value>)",
				"text-muted": "rgb(var(--color-text-muted-rgb) / <alpha-value>)",
				card: "rgb(var(--color-card-rgb) / <alpha-value>)",
				border: "rgb(var(--color-border-rgb) / <alpha-value>)",
			},
			fontFamily: {
				sans: ["Inter", "sans-serif"],
				display: ["Space Grotesk", "sans-serif"],
			},
			fontSize: {
				h1: ["2.25rem", { lineHeight: "1.2" }],
				h2: ["1.5rem", { lineHeight: "1.3" }],
				h3: ["1.25rem", { lineHeight: "1.4" }],
				base: ["1rem", { lineHeight: "1.5" }],
				sm: ["0.875rem", { lineHeight: "1.4" }],
				button: ["1rem", { lineHeight: "1.2", fontWeight: "600" }],
			},
		},
	},
};
