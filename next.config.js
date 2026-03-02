// next.config.js
/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
	reactStrictMode: true,
	turbopack: {
		root: path.resolve(__dirname),
	},

	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "i.ytimg.com",
			},
			// add any other external hosts here, e.g.:
			// { protocol: "https", hostname: "example.com" },
		],
	},
};

module.exports = nextConfig;
