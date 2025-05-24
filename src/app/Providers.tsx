// Providers.tsx
"use client";

import { GameProvider } from "@/context/GameContext";
import { SocketProvider } from "@/context/SocketContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
	const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
	if (!socketUrl) {
		throw new Error("NEXT_PUBLIC_SOCKET_URL is not defined");
	}

	return (
		<SocketProvider serverUrl={socketUrl}>
			<GameProvider>
				{children}
				<Toaster position="top-right" />
			</GameProvider>
		</SocketProvider>
	);
}
