"use client";

import type { AdminDashboardPayload } from "@/types/socket";
import AdminPlayerOverviewTable from "./AdminPlayerOverviewTable";
import styles from "@/components/admin/admin.module.css";

type AdminPlayerOverviewPanelProps = {
	dashboard: AdminDashboardPayload;
	roomTheme?: string | null;
	selectedHistoryPlayer: string | null;
	onSelectHistoryPlayer: (playerName: string) => void;
};

export default function AdminPlayerOverviewPanel({
	dashboard,
	roomTheme,
	selectedHistoryPlayer,
	onSelectHistoryPlayer,
}: AdminPlayerOverviewPanelProps) {
	return (
		<section
			className={`${styles.panel} ${styles.panelSecondary} flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 p-0 backdrop-blur-xl`}
		>
			<AdminPlayerOverviewTable
				dashboard={dashboard}
				roomTheme={roomTheme}
				selectedHistoryPlayer={selectedHistoryPlayer}
				onSelectHistoryPlayer={onSelectHistoryPlayer}
				embedded
			/>
		</section>
	);
}
