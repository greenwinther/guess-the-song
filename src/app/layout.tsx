// src/app/layout.tsx

import { GameProvider } from "@/contexts/GameContext";
import { SocketProvider } from "@/contexts/SocketContext";

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
