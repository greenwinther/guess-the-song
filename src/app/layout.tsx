// src/app/layout.tsx

import { GameProvider } from "@/contexts/tempContext";
import { SocketProvider } from "@/contexts/SocketContext";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html>
			<body>
				<SocketProvider>
					<GameProvider>{children}</GameProvider>
				</SocketProvider>
			</body>
		</html>
	);
}
