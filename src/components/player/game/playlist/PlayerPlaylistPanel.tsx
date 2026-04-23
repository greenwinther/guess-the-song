import clsx from "clsx";
import type { Submission } from "@/types/submission";

export default function PlayerPlaylistPanel({
	songs,
	revealedIds,
	currentSongId = null,
	variant = "game",
}: {
	songs: Submission[];
	revealedIds: number[];
	currentSongId?: number | null;
	variant?: "game" | "lobby";
}) {
	const isLobby = variant === "lobby";

	return (
		<aside
			className={clsx(
				"order-3 w-full min-h-0 border-t border-border p-4 sm:p-4 lg:order-none lg:col-span-3 lg:border-l lg:border-t-0 flex flex-col"
			)}
		>
			<div className="mb-3 sm:mb-4">
				<h2 className="text-lg font-semibold text-text sm:text-xl">Playlist</h2>
			</div>
			<div className="scrollbar-hidden min-h-[12rem] max-h-72 flex-1 space-y-1 overflow-y-auto rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)] sm:max-h-80 lg:max-h-[calc(100vh-12rem)]">
				{songs.length === 0 && (
					<div className="rounded-md px-3 py-4 text-sm text-text-muted">
						Waiting for the host to add songs.
					</div>
				)}
				{songs.map((s, idx) => (
					<div
						key={s.id}
						className={clsx(
							"w-full rounded-md border px-3 py-2 text-left text-text shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] transition-colors",
							currentSongId === s.id
								? "border-primary bg-primary/15"
								: isLobby
									? "border-border/70 bg-card/45 text-text/85 hover:bg-card/55"
									: "border-border/70 bg-card/45 hover:bg-card/60"
						)}
					>
						<div className="flex items-center gap-2">
							<span className="font-mono text-secondary text-xs sm:text-sm">{idx + 1}.</span>
							<span className="font-medium text-sm sm:text-base">
								{revealedIds.includes(s.id) ? s.title ?? s.url : "Guess the song"}
							</span>
						</div>
					</div>
				))}
			</div>
		</aside>
	);
}
