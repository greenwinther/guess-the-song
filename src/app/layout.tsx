// src/app/layout.tsx

import { GameProvider } from "@/contexts/tempContext";
import { SocketProvider } from "@/contexts/SocketContext";
import "./globals.css";
import SocketStatusBanner from "@/components/SocketStatusBanner";

export const metadata = {
	title: "Guess the Song",
	description: "Multiplayer music guessing game",
	icons: {
		icon: [
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{ url: "/favicon.ico", type: "image/x-icon" },
			{ url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
			{ url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
		],
		apple: "/apple-touch-icon.png",
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<SocketProvider>
					<GameProvider>
						<SocketStatusBanner />
						{children}
					</GameProvider>
				</SocketProvider>
			</body>
		</html>
	);
}
