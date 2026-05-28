import clsx from "clsx";
import PlaylistSidebar from "@/components/shared/playlist/PlaylistSidebar";
import type { Submission } from "@/types/submission";

export default function PlayerPlaylistPanel({
	songs,
	revealedIds,
	currentSongId = null,
	variant = "game",
	useSongArtworkBackground,
	onToggleSongArtworkBackground,
	className,
}: {
	songs: Submission[];
	revealedIds: number[];
	currentSongId?: number | null;
	variant?: "game" | "lobby";
	useSongArtworkBackground?: boolean;
	onToggleSongArtworkBackground?: () => void;
	className?: string;
}) {
	const isLobby = variant === "lobby";

	return (
		<PlaylistSidebar
			hasItems={songs.length > 0}
			emptyMessage="Waiting for the host to add songs."
			onToggleSongArtworkBackground={onToggleSongArtworkBackground}
			useSongArtworkBackground={useSongArtworkBackground}
			className={className}
		>
			<>
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
							<span className="font-medium text-xs sm:text-sm">
								{revealedIds.includes(s.id) ? s.title ?? s.url : "Guess the song"}
							</span>
						</div>
					</div>
				))}
			</>
		</PlaylistSidebar>
	);
}
