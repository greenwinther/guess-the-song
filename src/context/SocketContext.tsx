// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
	socket: Socket | null;
	connected: boolean;
	reconnecting: boolean;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
	children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [connected, setConnected] = useState(false);
	const [reconnecting, setReconnecting] = useState(false);

	useEffect(() => {
		const newSocket = io(undefined, {
			path: "/api/socket",
			reconnectionAttempts: 5, // Try reconnecting up to 5 times
			reconnectionDelay: 1000, // Start with 1 second delay
			reconnectionDelayMax: 5000, // Max delay between reconnect attempts
		});

		setSocket(newSocket);

		newSocket.on("connect", () => {
			console.log("Socket connected:", newSocket.id);
			setConnected(true);
			setReconnecting(false);
		});

		newSocket.on("disconnect", (reason) => {
			console.log("Socket disconnected:", reason);
			setConnected(false);
			// If disconnect is unexpected (not manual), start reconnect process
			if (reason !== "io client disconnect") {
				setReconnecting(true);
			}
		});

		newSocket.on("reconnect_attempt", (attempt) => {
			console.log(`Reconnection attempt #${attempt}`);
			setReconnecting(true);
		});

		newSocket.on("reconnect_failed", () => {
			console.log("Reconnection failed");
			setReconnecting(false);
		});

		newSocket.on("reconnect", (attempt) => {
			console.log(`Reconnected after ${attempt} attempts`);
			setConnected(true);
			setReconnecting(false);
		});

		return () => {
			newSocket.disconnect();
		};
	}, []);

	return (
		<SocketContext.Provider value={{ socket, connected, reconnecting }}>
			{children}
		</SocketContext.Provider>
	);
};

export const useSocketContext = (): SocketContextValue => {
	const context = useContext(SocketContext);
	if (!context) {
		throw new Error("useSocketContext must be used within a SocketProvider");
	}
	return context;
};
