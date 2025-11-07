// src/hooks/join/useReconnectNotice.ts
"use client";
import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";

export function useReconnectNotice() {
	const socket = useSocket();
	const [msg, setMsg] = useState<string | null>(null);

	useEffect(() => {
		if (!socket) return;

		const onConnect = () => setMsg(null);
		const onDisconnect = () => setMsg("Connection lost. Reconnecting…");

		// Manager-level signals are optional but nice for UX
		const onReconnectAttempt = () => setMsg("Reconnecting…");
		const onReconnect = () => setMsg(null);
		const onReconnectFailed = () => setMsg("Reconnection failed. Retrying…");

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);

		socket.io.on("reconnect_attempt", onReconnectAttempt);
		socket.io.on("reconnect", onReconnect);
		socket.io.on("reconnect_failed", onReconnectFailed);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);

			socket.io.off("reconnect_attempt", onReconnectAttempt);
			socket.io.off("reconnect", onReconnect);
			socket.io.off("reconnect_failed", onReconnectFailed);
		};
	}, [socket]);

	return msg;
}
