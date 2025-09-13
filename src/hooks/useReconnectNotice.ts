// src/hooks/join/useReconnectNotice.ts
import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";

export function useReconnectNotice(code: string, playerName: string) {
	const socket = useSocket();
	const [socketError, setSocketError] = useState<string | null>(null);
	const codeRef = useRef(code);
	const nameRef = useRef(playerName);

	useEffect(() => {
		codeRef.current = code;
		nameRef.current = playerName;
	}, [code, playerName]);

	useEffect(() => {
		const onDisconnect = (reason: any) => setSocketError("Connection lost. Reconnecting…");
		const onReconnect = (attempt?: number) => {
			setSocketError(null);
			socket.emit("joinRoom", { code: codeRef.current, name: nameRef.current });
		};

		socket.on("disconnect", onDisconnect);
		socket.on("connect", () => onReconnect());
		socket.on("reconnect", onReconnect);

		const mgr = (socket as any).io;
		mgr.on("connect", () => onReconnect());
		mgr.on("reconnect", onReconnect);

		return () => {
			socket.off("disconnect", onDisconnect);
			socket.off("connect", () => onReconnect());
			socket.off("reconnect", onReconnect);
			mgr.off("connect", () => onReconnect());
			mgr.off("reconnect", onReconnect);
		};
	}, [socket]);

	return socketError;
}
