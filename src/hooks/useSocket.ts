//src/hooks/useSocket.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type UseSocketOptions = {
	serverUrl?: string; // Optional: explicitly specify your server URL & port
	path?: string; // Optional: socket.io path, default "/"
};

export function useSocket({ serverUrl, path = "/" }: UseSocketOptions = {}) {
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		// Default to current origin if no serverUrl given
		const url = serverUrl || window.location.origin;

		// Create socket connection
		const socketIo = io(url, { path });

		socketIo.on("connect", () => {
			console.log("Socket connected:", socketIo.id);
		});

		socketIo.on("disconnect", (reason) => {
			console.log("Socket disconnected:", reason);
		});

		// Set socket instance into state so components can use it reactively
		setSocket(socketIo);

		// Cleanup on unmount: disconnect and clear socket state
		return () => {
			socketIo.disconnect();
			setSocket(null);
		};
	}, [serverUrl, path]);

	return socket;
}
