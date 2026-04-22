"use client";

import { useEffect, useState } from "react";
import type { AdminDashboardPayload } from "@/types/socket";

export function useAdminSelectedHistoryPlayer(dashboard: AdminDashboardPayload | null) {
	const [selectedHistoryPlayer, setSelectedHistoryPlayer] = useState<string | null>(null);

	useEffect(() => {
		setSelectedHistoryPlayer(null);
	}, [dashboard?.code]);

	useEffect(() => {
		if (!dashboard) return;
		const names = dashboard.currentSongRows.map((row) => row.playerName);
		if (names.length === 0) {
			if (selectedHistoryPlayer !== null) setSelectedHistoryPlayer(null);
			return;
		}
		if (!selectedHistoryPlayer || !names.includes(selectedHistoryPlayer)) {
			setSelectedHistoryPlayer(names[0]);
		}
	}, [dashboard, selectedHistoryPlayer]);

	const playerHistories = Array.isArray(dashboard?.playerHistories) ? dashboard.playerHistories : [];
	const historyByPlayer = new Map(playerHistories.map((entry) => [entry.playerName, entry.rounds]));
	const selectedHistoryRows = selectedHistoryPlayer
		? (historyByPlayer.get(selectedHistoryPlayer) ?? [])
		: [];

	return { selectedHistoryPlayer, selectedHistoryRows, setSelectedHistoryPlayer };
}
