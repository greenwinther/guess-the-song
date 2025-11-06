"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

type SocketStatus = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

const SocketContext = createContext<Socket | null>(null);
const SocketStatusContext = createContext<{ status: SocketStatus; error: string | null }>({
	status: "connecting",
	error: null,
});

// ── Singleton across the whole app (persists across Strict Mode remounts)
let socketSingleton: Socket | null = null;

function getSocket(): Socket {
	if (socketSingleton) return socketSingleton;

	const url = process.env.NEXT_PUBLIC_SOCKET_URL;
	if (!url) {
		// Gör ett tydligt fel tidigt om env saknas
		throw new Error("Missing NEXT_PUBLIC_SOCKET_URL");
	}

	socketSingleton = io(url, {
		transports: ["websocket"],
		reconnectionDelay: 200,
		reconnectionDelayMax: 1000,
		reconnectionAttempts: Infinity,
		autoConnect: false, // connect efter mount
	});

	return socketSingleton;
}

export function SocketProvider({ children }: { children: ReactNode }) {
	const socket = useMemo(getSocket, []);
	const [status, setStatus] = useState<SocketStatus>(socket.connected ? "connected" : "connecting");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Starta uppkoppling (idempotent)
		if (!socket.connected) {
			setStatus("connecting");
			setError(null);
			socket.connect();
		}

		// Koppla ned först när fliken/fönstret stängs
		const onUnload = () => {
			try {
				socket.disconnect();
			} catch {}
		};
		window.addEventListener("beforeunload", onUnload);

		// ---- Socket-level ----
		const onConnect = () => {
			setStatus("connected");
			setError(null);
		};
		const onDisconnect = (reason: string) => {
			// Socket.IO kallar även "transport close", "ping timeout", etc.
			setStatus("disconnected");
			// sätt error endast om det inte var en normal klient-disconnect
			setError(reason === "io client disconnect" ? null : reason || null);
		};
		const onConnectError = (err: Error) => {
			setStatus("error");
			setError(err?.message ?? "Connection error");
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("connect_error", onConnectError);

		// ---- Manager-level (återanslutning) ----
		const onReconnectAttempt = () => setStatus("reconnecting");
		const onReconnect = () => {
			setStatus("connected");
			setError(null);
		};
		const onReconnectError = () => {
			setStatus("error");
			setError("Reconnection error");
		};
		const onReconnectFailed = () => {
			setStatus("error");
			setError("Reconnection failed");
		};

		socket.io.on("reconnect_attempt", onReconnectAttempt);
		socket.io.on("reconnect", onReconnect);
		socket.io.on("reconnect_error", onReconnectError);
		socket.io.on("reconnect_failed", onReconnectFailed);

		return () => {
			// Ta bara bort listeners – låt singletonen vara uppkopplad
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("connect_error", onConnectError);

			socket.io.off("reconnect_attempt", onReconnectAttempt);
			socket.io.off("reconnect", onReconnect);
			socket.io.off("reconnect_error", onReconnectError);
			socket.io.off("reconnect_failed", onReconnectFailed);

			window.removeEventListener("beforeunload", onUnload);
			// ❌ Viktigt: ingen socket.disconnect() här – annars reconnect-loopar vid remounts
		};
	}, [socket]);

	return (
		<SocketContext.Provider value={socket}>
			<SocketStatusContext.Provider value={{ status, error }}>{children}</SocketStatusContext.Provider>
		</SocketContext.Provider>
	);
}

export function useSocket() {
	const sock = useContext(SocketContext);
	if (!sock) throw new Error("useSocket must be inside SocketProvider");
	return sock;
}

export function useSocketStatus() {
	return useContext(SocketStatusContext);
}
