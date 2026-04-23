"use client";

import type { AdminDashboardPayload } from "@/types/socket";
import type { Submission } from "@/types/submission";
import AdminHeader from "@/components/admin/common/AdminHeader";
import AdminPlayerGuessHistoryPanel from "./guess-history/AdminPlayerGuessHistoryPanel";
import AdminPlayerOverviewPanel from "./player-overview/AdminPlayerOverviewPanel";

type HistoryRow = {
	songId: number;
	songIndex: number;
	songTitle?: string | null;
	guessLabel: string;
	correctAnswer?: string | null;
	locked: boolean;
	guessOrder: string[];
	detailGuessLabel?: string;
	detailCorrectAnswer?: string | null;
	detailLocked: boolean;
	detailGuessOrder: string[];
	themeGuess?: string | null;
};

type AdminGameViewProps = {
	dashboard: AdminDashboardPayload;
	reconnecting: boolean;
	currentSong: Submission | null;
	roomTheme?: string | null;
	selectedHistoryPlayer: string | null;
	selectedHistoryRows: HistoryRow[];
	onSelectHistoryPlayer: (playerName: string) => void;
};

export default function AdminGameView({
	dashboard,
	reconnecting,
	currentSong,
	roomTheme,
	selectedHistoryPlayer,
	selectedHistoryRows,
	onSelectHistoryPlayer,
}: AdminGameViewProps) {
	return (
		<div className="flex flex-col gap-4">
			<AdminHeader roomCode={dashboard.code} />

			<div className="grid gap-4 xl:grid-cols-2">
				<AdminPlayerOverviewPanel
					dashboard={dashboard}
					reconnecting={reconnecting}
					currentSong={currentSong}
					roomTheme={roomTheme}
					selectedHistoryPlayer={selectedHistoryPlayer}
					onSelectHistoryPlayer={onSelectHistoryPlayer}
				/>

				<AdminPlayerGuessHistoryPanel
					dashboard={dashboard}
					selectedHistoryPlayer={selectedHistoryPlayer}
					rows={selectedHistoryRows}
				/>
			</div>
		</div>
	);
}
