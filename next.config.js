// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

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
