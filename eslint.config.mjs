import nextVitals from "eslint-config-next/core-web-vitals";

export default [
	...nextVitals,
	{
		ignores: ["dist/**", "eslint.config.mjs"],
	},
	{
		rules: {
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/purity": "off",
			"react-hooks/use-memo": "off",
		},
	},
];
