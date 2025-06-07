"use client";
// src/contexts/SocketContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
			transports: ["websocket"],
			reconnectionDelay: 200, // start retry after 200ms
			reconnectionDelayMax: 1000,
			reconnectionAttempts: Infinity,
		});
		setSocket(socket);
		return () => {
			socket.disconnect();
		};
	}, []);

	if (!socket) {
		return <div>Connecting…</div>;
	}

	return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
	const sock = useContext(SocketContext);
	if (!sock) throw new Error("useSocket must be inside SocketProvider");
	return sock;
}
