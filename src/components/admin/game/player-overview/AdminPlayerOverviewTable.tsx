// src/components/admin/game/player-overview/AdminPlayerOverviewTable.tsx

import { useMemo, useState } from "react";
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

type SortKey = "default" | "player" | "score";
type SortDirection = "asc" | "desc";

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
	const [sortKey, setSortKey] = useState<SortKey>("default");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const hasTheme =
		dashboard.theme.enabled ||
		Boolean(roomTheme?.trim()) ||
		dashboard.currentSongRows.some((row) => Boolean(row.themeGuess?.trim()));
	const guessColumnCount = 1 + (dashboard.hasDetailLane ? 1 : 0) + (hasTheme ? 1 : 0);
	const playerColumnWidth = 22;
	const scoreColumnWidth = 10;
	const guessColumnWidth = `${(100 - playerColumnWidth - scoreColumnWidth) / guessColumnCount}%`;

	const sortedRows = useMemo(() => {
		if (sortKey === "default") return dashboard.currentSongRows;
		const indexedRows = dashboard.currentSongRows.map((row, index) => ({ row, index }));
		indexedRows.sort((a, b) => {
			if (sortKey === "player") {
				const compared = a.row.playerName.localeCompare(b.row.playerName, undefined, {
					sensitivity: "base",
				});
				if (compared !== 0) return sortDirection === "asc" ? compared : -compared;
				return a.index - b.index;
			}

			const compared = a.row.totalScore - b.row.totalScore;
			if (compared !== 0) return sortDirection === "asc" ? compared : -compared;
			const fallbackByName = a.row.playerName.localeCompare(b.row.playerName, undefined, {
				sensitivity: "base",
			});
			if (fallbackByName !== 0) return fallbackByName;
			return a.index - b.index;
		});
		return indexedRows.map(({ row }) => row);
	}, [dashboard.currentSongRows, sortDirection, sortKey]);

	const togglePlayerSort = () => {
		if (sortKey !== "player") {
			setSortKey("player");
			setSortDirection("asc");
			return;
		}
		setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	const toggleScoreSort = () => {
		if (sortKey !== "score") {
			setSortKey("score");
			setSortDirection("desc");
			return;
		}
		setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
	};

	const playerSortLabel =
		sortKey === "player" ? `Player (sorted ${sortDirection})` : "Player (click to sort)";
	const scoreSortLabel =
		sortKey === "score"
			? `Score (sorted ${sortDirection}, highest or lowest)`
			: "Score (click to sort highest first)";
	const playerSortMarker = sortKey === "player" ? (sortDirection === "asc" ? "^" : "v") : "";
	const scoreSortMarker = sortKey === "score" ? (sortDirection === "asc" ? "^" : "v") : "";

	const content = (
		<>
			<div className={`${styles.tableInset} ${styles.tableScrollArea}`}>
				<table className={`min-w-full border-separate border-spacing-0 text-sm ${styles.tableGrid}`}>
					<colgroup>
						<col style={{ width: `${playerColumnWidth}%` }} />
						<col style={{ width: guessColumnWidth }} />
						{dashboard.hasDetailLane && <col style={{ width: guessColumnWidth }} />}
						{hasTheme && <col style={{ width: guessColumnWidth }} />}
						<col style={{ width: `${scoreColumnWidth}%` }} />
					</colgroup>
					<thead className={styles.tableHeader}>
						<tr className="text-left text-text/70 border-b border-border">
							<th
								className={`${styles.tableHeaderCell} py-2 px-3`}
								aria-sort={
									sortKey === "player"
										? sortDirection === "asc"
											? "ascending"
											: "descending"
										: "none"
								}
							>
								<button
									type="button"
									className="inline-flex items-center gap-1 hover:text-text"
									onClick={togglePlayerSort}
									aria-label={playerSortLabel}
									title="Sort by player name"
								>
									Player
									{playerSortMarker && <span aria-hidden="true">{playerSortMarker}</span>}
									<span className="sr-only">Press Enter to toggle player name sort direction.</span>
								</button>
							</th>
							<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Guess</th>
							{dashboard.hasDetailLane && (
								<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>Bonus Guess</th>
							)}
							{hasTheme && (
								<th className={`${styles.tableHeaderCell} py-2 px-3 text-center`}>
									<span className="inline-flex items-center justify-center gap-1">
										Theme Guess
										<span
											className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/25 text-[10px] text-text/75"
											title="Rank number shows solve order: 1 = first solver."
											aria-label="Theme rank info"
										>
											?
										</span>
									</span>
								</th>
							)}
							<th
								className={`${styles.tableHeaderCell} py-2 px-3 text-center`}
								aria-sort={
									sortKey === "score"
										? sortDirection === "asc"
											? "ascending"
											: "descending"
										: "none"
								}
							>
								<button
									type="button"
									className="inline-flex items-center gap-1 hover:text-text"
									onClick={toggleScoreSort}
									aria-label={scoreSortLabel}
									title="Sort by score"
								>
									Score
									{scoreSortMarker && <span aria-hidden="true">{scoreSortMarker}</span>}
									<span className="sr-only">Press Enter to toggle score sort direction.</span>
								</button>
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedRows.map((row) => (
							<tr
								key={row.playerName}
								tabIndex={0}
								role="button"
								aria-label={`View history for ${row.playerName}`}
								aria-pressed={selectedHistoryPlayer === row.playerName}
								className={`cursor-pointer ${
									selectedHistoryPlayer === row.playerName ? "bg-secondary/10" : "hover:bg-white/5"
								}`}
								onClick={() => onSelectHistoryPlayer(row.playerName)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										onSelectHistoryPlayer(row.playerName);
									}
								}}
							>
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
									<td className="py-2 px-3 text-text text-center">
										{row.themeGuess?.trim() || row.themeSolved ? (
											<span
												className={`inline-flex items-center gap-1 ${
													row.themeSolved ? "text-emerald-300" : ""
												}`}
											>
												<span>{row.themeGuess?.trim() || (row.themeSolved ? "Solved" : "")}</span>
												{row.themeSolved && row.themeSolvedRank != null && (
													<span
														className="text-xs text-emerald-200/75"
														aria-label={`Solve rank ${row.themeSolvedRank}`}
														title={`Solve rank ${row.themeSolvedRank}`}
													>
														{row.themeSolvedRank}
													</span>
												)}
											</span>
										) : (
											""
										)}
									</td>
								)}
								<td className="py-2 px-3 text-text text-center">{row.totalScore}</td>
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
