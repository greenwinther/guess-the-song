// src/components/admin/game/player-overview/AdminPlayerOverviewTable.tsx

import styles from "@/components/admin/admin.module.css";
import type { AdminDashboardPayload } from "@/types/socket";

export default function AdminPlayerOverviewTable({
	dashboard,
	selectedHistoryPlayer,
	onSelectHistoryPlayer,
	embedded = false,
}: {
	dashboard: AdminDashboardPayload;
	selectedHistoryPlayer: string | null;
	onSelectHistoryPlayer: (playerName: string) => void;
	embedded?: boolean;
}) {
	const lockedCount = dashboard.currentSongRows.filter((row) => row.locked).length;
	const totalGuessers = dashboard.currentSongRows.length;
	const detailLockedCount = dashboard.currentSongRows.filter((row) => row.detailLocked).length;

	const content = (
		<>
			<div className={`${styles.insetPanel} overflow-x-auto rounded-xl px-3 py-2`}>
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left text-text/70 border-b border-border">
							<th className="py-2 pr-3">Player</th>
							<th className="py-2 pr-3">Guess</th>
							<th className="py-2 pr-3">{`Locked in ${lockedCount}/${totalGuessers}`}</th>
							{dashboard.hasDetailLane && <th className="py-2 pr-3">Bonus Guess</th>}
							{dashboard.hasDetailLane && (
								<th className="py-2 pr-3">{`Bonus locked ${detailLockedCount}/${totalGuessers}`}</th>
							)}
							<th className="py-2 pr-3">History</th>
						</tr>
					</thead>
					<tbody>
						{dashboard.currentSongRows.map((row) => (
							<tr key={row.playerName} className="border-b border-border/60 last:border-b-0">
								<td className="py-2 pr-3 text-text">{row.playerName}</td>
								<td className="py-2 pr-3 text-text">{row.guessLabel}</td>
								<td className="py-2 pr-3 text-text/80">{row.locked ? "Yes" : "No"}</td>
								{dashboard.hasDetailLane && (
									<td className="py-2 pr-3 text-text">{row.detailLabel}</td>
								)}
								{dashboard.hasDetailLane && (
									<td className="py-2 pr-3 text-text/80">
										{row.detailLocked ? "Yes" : "No"}
									</td>
								)}
								<td className="py-2 pr-3">
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
