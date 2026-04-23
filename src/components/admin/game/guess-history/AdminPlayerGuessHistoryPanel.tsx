// src/components/admin/game/guess-history/AdminPlayerGuessHistoryPanel.tsx

import { FaLock } from "react-icons/fa6";
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
	themeGuess?: string | null;
};

function GuessValue({
	label,
	locked,
	inProgress,
}: {
	label: string;
	locked: boolean;
	inProgress: boolean;
}) {
	return (
		<span className="inline-flex items-center gap-2">
			<span className={!locked && inProgress ? "text-text/80" : undefined}>{label}</span>
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

export default function AdminPlayerGuessHistoryPanel({
	dashboard,
	selectedHistoryPlayer,
	rows,
}: {
	dashboard: AdminDashboardPayload;
	selectedHistoryPlayer: string | null;
	rows: HistoryRow[];
}) {
	const hasTheme = dashboard.theme.enabled || rows.some((row) => Boolean(row.themeGuess?.trim()));

	return (
		<section
			className={`${styles.panel} ${styles.panelSecondary} rounded-2xl border border-border/70 p-4 backdrop-blur-xl`}
		>
			<div className="flex flex-col gap-3">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold text-text">Guess History</h2>
					<div className="text-xs text-text/70">
						Showing:{" "}
						<span className="text-text">{selectedHistoryPlayer ?? "No player selected"}</span>
					</div>
				</div>
				<div className={`${styles.insetPanel} scrollbar-hidden max-h-[calc(100vh-24rem)] overflow-auto rounded-xl px-3 py-2`}>
					<table className="min-w-full text-sm">
						<thead className="sticky top-0 z-10 bg-[rgb(34_21_48)] shadow-[0_1px_0_rgb(255_255_255/0.08)]">
							<tr className="text-left text-text/70 border-b border-border">
								<th className="py-2 px-3">Song</th>
								<th className="py-2 px-3">Guess</th>
								<th className="py-2 px-3">Correct</th>
								{dashboard.hasDetailLane && (
									<>
										<th className="py-2 px-3">Bonus Guess</th>
										<th className="py-2 px-3">Bonus Correct</th>
									</>
								)}
								{hasTheme && <th className="py-2 px-3">Theme Guess</th>}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row.songId} className="border-b border-border/60 last:border-b-0">
									<td className="py-2 px-3 text-text">
										#{row.songIndex} {row.songTitle || "Untitled"}
									</td>
									<td className="py-2 px-3 text-text">
										<GuessValue
											label={row.guessLabel}
											locked={row.locked}
											inProgress={row.guessOrder.length > 0}
										/>
									</td>
									<td className="py-2 px-3 text-text">{row.correctAnswer || "-"}</td>
									{dashboard.hasDetailLane && (
										<>
											<td className="py-2 px-3 text-text">
												<GuessValue
													label={row.detailGuessLabel ?? "—"}
													locked={row.detailLocked}
													inProgress={row.detailGuessOrder.length > 0}
												/>
											</td>
											<td className="py-2 px-3 text-text">
												{row.detailCorrectAnswer || "-"}
											</td>
										</>
									)}
									{hasTheme && (
										<td className="py-2 px-3 text-text">{row.themeGuess?.trim() || "-"}</td>
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
