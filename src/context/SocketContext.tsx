// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

interface SocketProviderProps {
	serverUrl?: string;
	path?: string;
	children: ReactNode;
}

export const SocketProvider = ({ serverUrl, path = "/", children }: SocketProviderProps) => {
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		const url = serverUrl || window.location.origin;
		const socketIo = io(url, { path });

		setSocket(socketIo);

		socketIo.on("connect", () => console.log("Socket connected", socketIo.id));
		socketIo.on("disconnect", (reason) => console.log("Socket disconnected", reason));

		return () => {
			socketIo.disconnect();
			setSocket(null);
		};
	}, [serverUrl, path]);

	return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocketContext = (): Socket => {
	const socket = useContext(SocketContext);
	if (!socket) {
		throw new Error("useSocket must be used within a SocketProvider");
	}
	return socket;
};
