import { defineConfig } from "@playwright/test";

const appUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://127.0.0.1:4000";

export default defineConfig({
	testDir: "./src/tests",
	testMatch: /.*\.spec\.ts/,
	timeout: 30_000,
	workers: 1,
	use: {
		baseURL: appUrl,
		headless: true,
	},
	webServer: {
		command: "npm run dev",
		url: appUrl,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			...process.env,
			CLIENT_URL: appUrl,
			NEXT_PUBLIC_SOCKET_URL: socketUrl,
			SOCKET_PORT: process.env.SOCKET_PORT ?? "4000",
			YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ?? "ci-placeholder-key",
		},
	},
});
