// src/hooks/useReconnectNotice.ts
"use client";
import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";

export function useReconnectNotice() {
	const socket = useSocket();
	const [msg, setMsg] = useState<string | null>(null);
	const [suppress, setSuppress] = useState(false);

	useEffect(() => {
		if (!socket) return;

		const onConnect = () => {
			if (!suppress) {
				try {
					window.dispatchEvent(new Event("gts-socket-synced"));
				} catch {}
			}
			setMsg(null);
		};
		const onDisconnect = () => {
			if (suppress) return;
			setMsg("Connection lost. Trying to reconnect...");
		};

		// Manager-level signals are optional but nice for UX
		const onReconnectAttempt = () => {
			if (suppress) return;
			setMsg("Reconnecting...");
		};
		const onReconnect = () => {
			if (!suppress) {
				try {
					window.dispatchEvent(new Event("gts-socket-synced"));
				} catch {}
			}
			setMsg(null);
		};
		const onReconnectFailed = () => {
			if (suppress) return;
			setMsg("Reconnection failed. Retrying...");
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);

		socket.io.on("reconnect_attempt", onReconnectAttempt);
		socket.io.on("reconnect", onReconnect);
		socket.io.on("reconnect_failed", onReconnectFailed);

		const onJoinDenied = () => {
			setSuppress(true);
			setMsg(null);
		};
		const onSocketSynced = () => {
			setSuppress(false);
		};
		const onStorage = () => {
			try {
				const raw = localStorage.getItem("gts-join-denied");
				if (!raw) return;
				const parsed = JSON.parse(raw) as { reason?: string; at?: number };
				if (parsed?.reason === "kicked") {
					onJoinDenied();
				}
			} catch {}
		};
		window.addEventListener("gts-join-denied", onJoinDenied);
		window.addEventListener("gts-socket-synced", onSocketSynced);
		window.addEventListener("storage", onStorage);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);

			socket.io.off("reconnect_attempt", onReconnectAttempt);
			socket.io.off("reconnect", onReconnect);
			socket.io.off("reconnect_failed", onReconnectFailed);
			window.removeEventListener("gts-join-denied", onJoinDenied);
			window.removeEventListener("gts-socket-synced", onSocketSynced);
			window.removeEventListener("storage", onStorage);
		};
	}, [socket, suppress]);

	return msg;
}
