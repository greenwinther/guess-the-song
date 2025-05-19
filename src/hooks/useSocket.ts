//src/hooks/useSocket.ts
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		socketRef.current = io(undefined, {
			path: "/api/socket",
		});

		socketRef.current.on("connect", () => {
			console.log("Connected to server");
		});

		return () => {
			socketRef.current?.disconnect();
		};
	}, []);

	return socketRef.current;
}
