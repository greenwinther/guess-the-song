"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import type { AdminDashboardPayload } from "@/types/socket";
import type { AdminAccessState } from "./useAdminHostAccess";

type UseAdminDashboardOptions = {
	code: string;
	access: AdminAccessState;
	onAccessChange: (nextAccess: AdminAccessState) => void;
};

export function useAdminDashboard({
	code,
	access,
	onAccessChange,
}: UseAdminDashboardOptions) {
	const socket = useSocket();
	const [dashboard, setDashboard] = useState<AdminDashboardPayload | null>(null);

	useEffect(() => {
		setDashboard(null);
	}, [code]);

	const requestDashboard = useCallback(() => {
		if (!socket || access !== "authorized") return;
		socket.emit("ADMIN_GET_DASHBOARD", { code }, (res) => {
			if (!res.ok) {
				if (res.error === "ROOM_NOT_FOUND") {
					onAccessChange("not_found");
					return;
				}
				if (res.error === "NOT_AUTHORIZED") {
					onAccessChange("unauthorized");
					return;
				}
				return;
			}
			setDashboard(res.dashboard);
		});
	}, [socket, access, code, onAccessChange]);

	useEffect(() => {
		if (!socket || access !== "authorized") return;

		requestDashboard();

		const onPush = ({ dashboard: next }: { dashboard: AdminDashboardPayload }) => {
			setDashboard(next);
		};
		const refresh = () => requestDashboard();

		socket.on("ADMIN_DASHBOARD", onPush);
		socket.on("roomData", refresh);
		socket.on("songChanged", refresh);
		socket.on("playerGuessLocked", refresh);
		socket.on("playerGuessUndo", refresh);
		socket.on("detailLockSnapshot", refresh);
		socket.on("detailFinalized", refresh);
		socket.on("THEME_SOLVED", refresh);
		socket.on("THEME_GUESSED_THIS_ROUND", refresh);
		socket.on("THEME_REVEALED", refresh);
		socket.on("THEME_HINT_READY", refresh);
		socket.on("gameStarted", refresh);
		socket.on("gameOver", refresh);
		socket.on("songAdded", refresh);
		socket.on("songRemoved", refresh);
		socket.on("THEME_UPDATED", refresh);

		const interval = window.setInterval(requestDashboard, 5000);

		return () => {
			window.clearInterval(interval);
			socket.off("ADMIN_DASHBOARD", onPush);
			socket.off("roomData", refresh);
			socket.off("songChanged", refresh);
			socket.off("playerGuessLocked", refresh);
			socket.off("playerGuessUndo", refresh);
			socket.off("detailLockSnapshot", refresh);
			socket.off("detailFinalized", refresh);
			socket.off("THEME_SOLVED", refresh);
			socket.off("THEME_GUESSED_THIS_ROUND", refresh);
			socket.off("THEME_REVEALED", refresh);
			socket.off("THEME_HINT_READY", refresh);
			socket.off("gameStarted", refresh);
			socket.off("gameOver", refresh);
			socket.off("songAdded", refresh);
			socket.off("songRemoved", refresh);
			socket.off("THEME_UPDATED", refresh);
		};
	}, [socket, access, requestDashboard]);

	return dashboard;
}
