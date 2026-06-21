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
	lockedAt?: number | null;
	fastestCorrectLock?: boolean;
	guessOrder: string[];
	detailGuessLabel?: string;
	detailCorrectAnswer?: string | null;
	detailLocked: boolean;
	detailGuessOrder: string[];
	themeGuess?: string | null;
};

const normalizeGuessLabel = (label: string) => {
	const trimmed = label.trim();
	if (trimmed === "-" || trimmed === "—") return "";
	return label;
};

const normalizeForCompare = (value: string | null | undefined) =>
	(value ?? "")
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\p{L}\p{N} ]+/gu, "")
		.trim();

const formatLockTime = (lockedAt?: number | null) => {
	if (!lockedAt) return "";
	return new Date(lockedAt).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
};

function GuessValue({
	label,
	locked,
	inProgress,
	correct = false,
}: {
	label: string;
	locked: boolean;
	inProgress: boolean;
	correct?: boolean;
}) {
	const visibleLabel = normalizeGuessLabel(label);
	return (
		<span className="inline-flex items-center gap-2">
			<span className={correct ? "text-emerald-300" : !locked && inProgress ? "text-text/80" : undefined}>
				{visibleLabel}
			</span>
			{locked && (
				<FaLock className="h-3 w-3 shrink-0 text-secondary" aria-label="Locked" title="Locked" />
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
	const columnCount = 3 + (dashboard.hasDetailLane ? 2 : 0) + (hasTheme ? 1 : 0);
	const colSpan = columnCount;
	const activeSongId = dashboard.activeSongId;
	const normalizedThemeValue = normalizeForCompare(dashboard.theme.value);
	const songColumnWidth = 32;
	const otherColumnCount = Math.max(columnCount - 1, 1);
	const otherColumnWidth = `${(100 - songColumnWidth) / otherColumnCount}%`;

	return (
		<section
			className={`${styles.panel} ${styles.panelSecondary} flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 p-0 backdrop-blur-xl`}
		>
			<div className={`${styles.tableInset} ${styles.tableScrollArea}`}>
				<table className={`min-w-full border-separate border-spacing-0 text-sm ${styles.tableGrid}`}>
					<colgroup>
						<col style={{ width: `${songColumnWidth}%` }} />
						{Array.from({ length: otherColumnCount }).map((_, index) => (
							<col key={index} style={{ width: otherColumnWidth }} />
						))}
					</colgroup>
					<thead className={styles.tableHeader}>
						<tr className="text-left text-text/70 border-b border-border">
							<th className={`${styles.tableHeaderCell} py-2 px-3`}>Song</th>
							<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Guess</th>
							<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Correct G</th>
							{dashboard.hasDetailLane && (
								<>
									<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Bonus G</th>
									<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Bonus C</th>
								</>
							)}
							{hasTheme && (
								<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Theme G</th>
							)}
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 && (
							<tr>
								<td className="py-3 px-3 text-text/70" colSpan={colSpan}>
									{selectedHistoryPlayer
										? "No history rows for this player yet."
										: "Select a player from the overview table to view history."}
								</td>
							</tr>
						)}
						{rows.map((row) => {
							const isActiveSong = activeSongId === row.songId;
							const isGuessCorrect =
								row.guessOrder.length > 0 &&
								normalizeForCompare(row.guessOrder[0]) === normalizeForCompare(row.correctAnswer);
							const isDetailGuessCorrect =
								row.detailGuessOrder.length > 0 &&
								normalizeForCompare(row.detailGuessOrder[0]) ===
									normalizeForCompare(row.detailCorrectAnswer);
							const isThemeGuessCorrect =
								normalizeForCompare(row.themeGuess) !== "" &&
								normalizedThemeValue !== "" &&
								normalizeForCompare(row.themeGuess) === normalizedThemeValue;
							const lockTime = formatLockTime(row.lockedAt);

							return (
								<tr key={row.songId} className={`${isActiveSong ? "bg-secondary/10" : ""}`}>
									<td className="py-2 px-3 text-text">
										#{row.songIndex} {row.songTitle || "Untitled"}
									</td>
									<td className="py-2 px-3 text-text text-center">
										<GuessValue
											label={row.guessLabel}
											locked={row.locked}
											inProgress={row.guessOrder.length > 0}
											correct={isGuessCorrect}
										/>
										{row.fastestCorrectLock && isGuessCorrect && (
											<span className="ml-2 inline-flex rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
												Fastest correct lock
											</span>
										)}
										{lockTime && (
											<span className="ml-2 text-xs text-text/55" title="Final lock time">
												{lockTime}
											</span>
										)}
									</td>
									<td className="py-2 px-3 text-text text-center">{row.correctAnswer || ""}</td>
									{dashboard.hasDetailLane && (
										<>
											<td className="py-2 px-3 text-text text-center">
												<GuessValue
													label={row.detailGuessLabel ?? ""}
													locked={row.detailLocked}
													inProgress={row.detailGuessOrder.length > 0}
													correct={isDetailGuessCorrect}
												/>
											</td>
											<td className="py-2 px-3 text-text text-center">
												{row.detailCorrectAnswer || ""}
											</td>
										</>
									)}
									{hasTheme && (
										<td
											className={`py-2 px-3 text-center ${
												isThemeGuessCorrect ? "text-emerald-300" : "text-text"
											}`}
										>
											{row.themeGuess?.trim() || ""}
										</td>
									)}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}

