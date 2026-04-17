// src/components/admin/AdminGuessHistoryPanel.tsx

import type { AdminDashboardPayload } from "@/types/socket";

import styles from "@/components/admin/admin.module.css";

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
};

export default function AdminGuessHistoryPanel({
	dashboard,
	selectedHistoryPlayer,
	rows,
}: {
	dashboard: AdminDashboardPayload;
	selectedHistoryPlayer: string | null;
	rows: HistoryRow[];
}) {
	return (
		<section className={`${styles.panel} ${styles.panelSecondary} rounded-2xl border border-border/70 p-4 backdrop-blur-xl`}>
			<div className="flex flex-col gap-3">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold text-text">Guess History</h2>
					<div className="text-xs text-text/70">
						Showing: <span className="text-text">{selectedHistoryPlayer ?? "No player selected"}</span>
					</div>
				</div>
				<div className={`${styles.insetPanel} overflow-x-auto rounded-xl px-3 py-2`}>
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-text/70 border-b border-border">
								<th className="py-2 px-3">Song</th>
								<th className="py-2 px-3">Guess</th>
								<th className="py-2 px-3">Correct</th>
								<th className="py-2 px-3">Locked</th>
								{dashboard.hasDetailLane && (
									<>
										<th className="py-2 px-3">Detail Guess</th>
										<th className="py-2 px-3">Detail Correct</th>
										<th className="py-2 px-3">Detail Locked</th>
									</>
								)}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row.songId} className="border-b border-border/60 last:border-b-0">
									<td className="py-2 px-3 text-text">#{row.songIndex} {row.songTitle || "Untitled"}</td>
									<td className="py-2 px-3 text-text">{row.guessLabel}</td>
									<td className="py-2 px-3 text-text">{row.correctAnswer || "-"}</td>
									<td className="py-2 px-3 text-text/80">
										{row.locked ? "Yes" : row.guessOrder.length > 0 ? "In progress" : "No"}
									</td>
									{dashboard.hasDetailLane && (
										<>
											<td className="py-2 px-3 text-text">{row.detailGuessLabel}</td>
											<td className="py-2 px-3 text-text">{row.detailCorrectAnswer || "-"}</td>
											<td className="py-2 px-3 text-text/80">
												{row.detailLocked ? "Yes" : row.detailGuessOrder.length > 0 ? "In progress" : "No"}
											</td>
										</>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}
