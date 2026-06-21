"use client";

import type { AdminDashboardPayload } from "@/types/socket";
import AdminHeader from "@/components/admin/common/AdminHeader";
import AdminPlayerGuessHistoryPanel from "./guess-history/AdminPlayerGuessHistoryPanel";
import AdminPlayerOverviewPanel from "./player-overview/AdminPlayerOverviewPanel";
import styles from "@/components/admin/admin.module.css";

type HistoryRow = {
	songId: number;
	songIndex: number;
	songTitle?: string | null;
	guessLabel: string;
	correctAnswer?: string | null;
	locked: boolean;
	lockedAt?: number | null;
	fastestCorrectLock?: boolean;
	guessOrder: string[];
	detailGuessLabel?: string;
	detailCorrectAnswer?: string | null;
	detailLocked: boolean;
	detailGuessOrder: string[];
	themeGuess?: string | null;
};

type AdminGameViewProps = {
	dashboard: AdminDashboardPayload;
	roomTheme?: string | null;
	selectedHistoryPlayer: string | null;
	selectedHistoryRows: HistoryRow[];
	onSelectHistoryPlayer: (playerName: string) => void;
};

export default function AdminGameView({
	dashboard,
	roomTheme,
	selectedHistoryPlayer,
	selectedHistoryRows,
	onSelectHistoryPlayer,
}: AdminGameViewProps) {
	const themeValue = dashboard.theme.value?.trim() || roomTheme?.trim() || "";
	const bonusValue = dashboard.detailQuestion?.trim() || "";

	return (
		<div className="flex h-full min-h-0 flex-col gap-4">
			<AdminHeader roomCode={dashboard.code} phase={dashboard.phase} />
			<section className={styles.roundContextStrip} aria-label="Round context">
				<div className={styles.roundContextItem} title={themeValue || "No theme set"}>
					<span className={styles.roundContextLabel}>Theme</span>
					<span className={styles.roundContextValue}>{themeValue || "Not set"}</span>
				</div>
				<div className={styles.roundContextItem} title={bonusValue || "No bonus question set"}>
					<span className={styles.roundContextLabel}>Bonus</span>
					<span className={styles.roundContextValue}>{bonusValue || "Not set"}</span>
				</div>
			</section>

			<div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
				<AdminPlayerOverviewPanel
					dashboard={dashboard}
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
