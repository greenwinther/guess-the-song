// src/components/admin/game/player-overview/AdminPlayerOverviewTable.tsx

import { FaLock } from "react-icons/fa6";
import styles from "@/components/admin/admin.module.css";
import type { AdminDashboardPayload } from "@/types/socket";

const normalizeGuessLabel = (label: string) => {
	const trimmed = label.trim();
	if (trimmed === "-" || trimmed === "—") return "";
	return label;
};

function GuessValue({ label, locked }: { label: string; locked: boolean }) {
	const visibleLabel = normalizeGuessLabel(label);
	return (
		<span className="inline-flex items-center gap-2">
			<span>{visibleLabel}</span>
			{locked && (
				<FaLock
					className="h-3 w-3 shrink-0 text-secondary"
					aria-label="Locked"
					title="Locked"
				/>
			)}
		</span>
	);
}

export default function AdminPlayerOverviewTable({
	dashboard,
	roomTheme,
	selectedHistoryPlayer,
	onSelectHistoryPlayer,
	embedded = false,
}: {
	dashboard: AdminDashboardPayload;
	roomTheme?: string | null;
	selectedHistoryPlayer: string | null;
	onSelectHistoryPlayer: (playerName: string) => void;
	embedded?: boolean;
}) {
	const hasTheme =
		dashboard.theme.enabled ||
		Boolean(roomTheme?.trim()) ||
		dashboard.currentSongRows.some((row) => Boolean(row.themeGuess?.trim()));
	const guessColumnCount = 1 + (dashboard.hasDetailLane ? 1 : 0) + (hasTheme ? 1 : 0);
	const playerColumnWidth = 20;
	const scoreColumnWidth = 10;
	const historyColumnWidth = 12;
	const guessColumnWidth = `${(100 - playerColumnWidth - scoreColumnWidth - historyColumnWidth) / guessColumnCount}%`;

	const content = (
		<>
			<div
				className={`${styles.tableInset} ${styles.tableScrollArea}`}
			>
				<table className={`min-w-full border-separate border-spacing-0 text-sm ${styles.tableGrid}`}>
					<colgroup>
						<col style={{ width: `${playerColumnWidth}%` }} />
						<col style={{ width: guessColumnWidth }} />
						{dashboard.hasDetailLane && <col style={{ width: guessColumnWidth }} />}
						{hasTheme && <col style={{ width: guessColumnWidth }} />}
						<col style={{ width: `${scoreColumnWidth}%` }} />
						<col style={{ width: `${historyColumnWidth}%` }} />
					</colgroup>
					<thead className={styles.tableHeader}>
						<tr className="text-left text-text/70 border-b border-border">
							<th className={`${styles.tableHeaderCell} py-2 px-3`}>Player</th>
							<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Guess</th>
							{dashboard.hasDetailLane && (
								<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Bonus Guess</th>
							)}
							{hasTheme && (
								<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Theme Guess</th>
							)}
							<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Score</th>
							<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>History</th>
						</tr>
					</thead>
					<tbody>
						{dashboard.currentSongRows.map((row) => (
							<tr key={row.playerName}>
								<td className="py-2 px-3 text-text">{row.playerName}</td>
								<td className="py-2 px-3 text-text text-center">
									<GuessValue label={row.guessLabel} locked={row.locked} />
								</td>
								{dashboard.hasDetailLane && (
									<td className="py-2 px-3 text-text text-center">
										<GuessValue label={row.detailLabel} locked={row.detailLocked} />
									</td>
								)}
								{hasTheme && (
									<td className="py-2 px-3 text-text text-center">{row.themeGuess?.trim() || ""}</td>
								)}
								<td className="py-2 px-3 text-text text-center">{row.totalScore}</td>
								<td className="py-2 px-3 text-center">
									<button
										type="button"
										className={`rounded border px-2 py-1 text-xs transition-colors ${
											selectedHistoryPlayer === row.playerName
												? "border-secondary/60 bg-secondary/10 text-text shadow-[0_0_0_1px_rgb(var(--color-secondary-rgb)/0.14)]"
												: "border-border text-text/90 hover:bg-card/80"
										}`}
										onClick={() => onSelectHistoryPlayer(row.playerName)}
									>
										{selectedHistoryPlayer === row.playerName ? "Viewing" : "View"}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	);

	return embedded ? (
		content
	) : (
		<section className={`${styles.panel} rounded-xl border border-border/80 p-4 backdrop-blur-xl`}>
			{content}
		</section>
	);
}
