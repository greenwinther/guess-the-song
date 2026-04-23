// src/components/admin/game/player-overview/AdminPlayerOverviewTable.tsx

import { FaLock } from "react-icons/fa6";
import styles from "@/components/admin/admin.module.css";
import type { AdminDashboardPayload } from "@/types/socket";

function GuessValue({ label, locked }: { label: string; locked: boolean }) {
	return (
		<span className="inline-flex items-center gap-2">
			<span>{label}</span>
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

	const content = (
		<>
			<div className={`${styles.insetPanel} overflow-x-auto rounded-xl px-3 py-2`}>
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left text-text/70 border-b border-border">
							<th className="py-2 pr-3">Player</th>
							<th className="py-2 pr-3">Guess</th>
							{dashboard.hasDetailLane && <th className="py-2 pr-3">Bonus Guess</th>}
							{hasTheme && <th className="py-2 pr-3">Theme Guess</th>}
							<th className="py-2 pr-3">History</th>
						</tr>
					</thead>
					<tbody>
						{dashboard.currentSongRows.map((row) => (
							<tr key={row.playerName} className="border-b border-border/60 last:border-b-0">
								<td className="py-2 pr-3 text-text">{row.playerName}</td>
								<td className="py-2 pr-3 text-text">
									<GuessValue label={row.guessLabel} locked={row.locked} />
								</td>
								{dashboard.hasDetailLane && (
									<td className="py-2 pr-3 text-text">
										<GuessValue label={row.detailLabel} locked={row.detailLocked} />
									</td>
								)}
								{hasTheme && (
									<td className="py-2 pr-3 text-text">{row.themeGuess?.trim() || "-"}</td>
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
