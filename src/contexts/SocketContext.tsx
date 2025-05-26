"use client";
// src/contexts/SocketContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000");
		setSocket(s);
		return () => {
			s.disconnect();
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
