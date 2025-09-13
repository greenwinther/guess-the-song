"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

type SocketStatus = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

const SocketContext = createContext<Socket | null>(null);
const SocketStatusContext = createContext<{ status: SocketStatus; error: string | null }>({
	status: "connecting",
	error: null,
});

export function SocketProvider({ children }: { children: ReactNode }) {
	// Create socket synchronously so the app doesn't block rendering
	const socket = useMemo(
		() =>
			io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
				transports: ["websocket"],
				reconnectionDelay: 200,
				reconnectionDelayMax: 1000,
				reconnectionAttempts: Infinity,
			}),
		[]
	);

	const [status, setStatus] = useState<SocketStatus>("connecting");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// ── Socket-level (typed with params) ───────────────────────────
		const onConnect = () => {
			setStatus("connected");
			setError(null);
		};
		const onDisconnect = (reason: string) => {
			setStatus("disconnected");
			setError(reason === "io client disconnect" ? null : reason || null);
		};
		const onConnectError = (err: Error) => {
			setStatus("error");
			setError(err?.message ?? "Connection error");
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("connect_error", onConnectError);

		// ── Manager-level (use zero-arg handlers to satisfy types) ─────
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
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("connect_error", onConnectError);

			socket.io.off("reconnect_attempt", onReconnectAttempt);
			socket.io.off("reconnect", onReconnect);
			socket.io.off("reconnect_error", onReconnectError);
			socket.io.off("reconnect_failed", onReconnectFailed);

			socket.disconnect();
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
