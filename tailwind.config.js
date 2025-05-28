// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/components/**/*.{js,ts,jsx,tsx}", "./src/app/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				bg: "#0D0C1F",
				primary: "#A96CFA",
				secondary: "#3DAEFF",
				highlight: "#69F8D6",
				text: "#E1E1E9",
				"text-muted": "#A9A9D2",
				card: "#1B1838",
				border: "#2A2C48",
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
