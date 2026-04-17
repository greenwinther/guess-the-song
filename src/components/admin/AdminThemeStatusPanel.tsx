// src/components/admin/AdminThemeStatusPanel.tsx

import styles from "@/components/admin/admin.module.css";
import type { AdminDashboardPayload } from "@/types/socket";

export default function AdminThemeStatusPanel({
	dashboard,
	embedded = false,
}: {
	dashboard: AdminDashboardPayload;
	embedded?: boolean;
}) {
	if (!dashboard.theme.enabled) return null;

	const content = (
		<div className="flex flex-col gap-3">
			<div className="space-y-1">
				<h2 className="text-lg font-semibold text-text">Theme Side-Game</h2>
				<div className="text-xs text-text/70">
					Hint: {dashboard.theme.hint ?? "-"} | Revealed: {dashboard.theme.revealed ? "Yes" : "No"}
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead>
						<tr className="text-left text-text/70 border-b border-border">
							<th className="py-2 pr-3">Player</th>
							<th className="py-2 pr-3">Theme Status</th>
						</tr>
					</thead>
					<tbody>
						{dashboard.currentSongRows.map((row) => (
							<tr key={`${row.playerName}-theme`} className="border-b border-border/60 last:border-b-0">
								<td className="py-2 pr-3 text-text">{row.playerName}</td>
								<td className="py-2 pr-3 text-text/80">
									{row.themeSolved
										? "Solved"
										: row.themeGuessedThisRound
											? "Guessed this round"
											: "No guess this round"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);

	return embedded ? content : <section className={`${styles.panel} rounded-xl border border-border/80 p-4 backdrop-blur-xl`}>{content}</section>;
}
