// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	images: {
		domains: [
			"i.ytimg.com", // for YouTube thumbnails
			// add any other external hosts here, e.g.:
			// "example.com",
		],
	},
};

module.exports = nextConfig;
