// src/components/admin/AdminRoomHeader.tsx

import styles from "@/components/admin/admin.module.css";
import type { AdminDashboardPayload } from "@/types/socket";

export default function AdminRoomHeader({
	dashboard,
	reconnecting,
	currentSongSubmitter,
	currentSongDetailAnswer,
	embedded = false,
}: {
	dashboard: AdminDashboardPayload;
	reconnecting: boolean;
	currentSongSubmitter?: string | null;
	currentSongDetailAnswer?: string | null;
	embedded?: boolean;
}) {
	const content = (
		<header className={embedded ? "rounded-lg pb-3" : "rounded-lg pb-3"}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 flex-1 space-y-2">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h1 className="text-xl font-semibold text-text sm:text-[1.4rem]">
							{dashboard.activeSongIndex ? `Song ${dashboard.activeSongIndex}` : "Waiting for song"}
						</h1>
						<div className="flex flex-wrap items-center justify-end gap-2">
							<span className="text-xs rounded border border-border/70 px-2 py-0.5 text-text/72">
								Phase {dashboard.phase ?? "LOBBY"}
							</span>
							<span
								className={`text-xs rounded border px-2 py-0.5 ${
									reconnecting
										? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
										: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
								}`}
							>
								{reconnecting ? "Reconnecting..." : "Connected"}
							</span>
						</div>
					</div>
					<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
						<div className="min-w-0 space-y-1">
							<div className="text-sm text-text/88">
								{dashboard.currentSongTitle ?? "No active song yet"}
							</div>
							{dashboard.hasDetailLane && (
								<div className="text-sm">
									<span className="text-text/55">Bonus quest:</span>{" "}
									<span className="text-text/78">{dashboard.detailQuestion ?? "Enabled"}</span>
								</div>
							)}
						</div>
						<div className="space-y-1 text-sm sm:text-right">
							<div>
								<span className="text-text/55">Correct answer:</span>{" "}
								<span className="text-text/82">{currentSongSubmitter ?? "-"}</span>
							</div>
							{dashboard.hasDetailLane && (
								<div>
									<span className="text-text/55">Bonus answer:</span>{" "}
									<span className="text-text/82">{currentSongDetailAnswer ?? "-"}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</header>
	);

	return embedded ? content : content;
}
