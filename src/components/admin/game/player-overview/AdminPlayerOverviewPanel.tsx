"use client";

import type { AdminDashboardPayload } from "@/types/socket";
import type { Submission } from "@/types/submission";
import AdminPlayerOverviewSummary from "./AdminPlayerOverviewSummary";
import AdminPlayerOverviewTable from "./AdminPlayerOverviewTable";
import AdminThemeStatusTable from "./AdminThemeStatusTable";
import styles from "@/components/admin/admin.module.css";

type AdminPlayerOverviewPanelProps = {
	dashboard: AdminDashboardPayload;
	reconnecting: boolean;
	currentSong: Submission | null;
	selectedHistoryPlayer: string | null;
	onSelectHistoryPlayer: (playerName: string) => void;
};

export default function AdminPlayerOverviewPanel({
	dashboard,
	reconnecting,
	currentSong,
	selectedHistoryPlayer,
	onSelectHistoryPlayer,
}: AdminPlayerOverviewPanelProps) {
	return (
		<section
			className={`${styles.panel} ${styles.panelPrimary} rounded-2xl border border-border/70 p-4 backdrop-blur-xl`}
		>
			<div className="flex min-w-0 flex-col gap-4">
				<AdminPlayerOverviewSummary
					dashboard={dashboard}
					reconnecting={reconnecting}
					currentSongSubmitter={currentSong?.submitter ?? null}
					currentSongBonusAnswer={currentSong?.detailAnswer ?? null}
					embedded
				/>
				<AdminPlayerOverviewTable
					dashboard={dashboard}
					selectedHistoryPlayer={selectedHistoryPlayer}
					onSelectHistoryPlayer={onSelectHistoryPlayer}
					embedded
				/>
				{dashboard.theme.enabled && <AdminThemeStatusTable dashboard={dashboard} embedded />}
			</div>
		</section>
	);
}
