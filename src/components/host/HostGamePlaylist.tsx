// src/components/host/HostGamePlaylist.tsx
"use client";

import Button from "@/components/ui/Button";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import type { Song } from "@/types/room";
import { useMemo } from "react";

export default function HostGamePlaylist({
	songs,
	revealedIds,
	currentSongId,
	onSelect,
	allPlayed: allPlayedProp,
}: {
	songs: Song[];
	revealedIds: number[];
	currentSongId: number | null;
	onSelect: (song: Song) => void;
	allPlayed?: boolean;
}) {
	const socket = useSocket();
	const { room, revealedSubmitters = [], setRevealedSubmitters } = useGame();

	// pull this outside the useMemo
	const roomPlayedCount = (room as any)?.playedCount as number | undefined;

	const effectiveAllPlayed = useMemo(() => {
		if (typeof allPlayedProp === "boolean") return allPlayedProp;

		const total = songs?.length ?? 0;
		const playedFromSongs = songs?.filter((s: any) => s?.played === true).length ?? 0;
		const played = typeof roomPlayedCount === "number" ? roomPlayedCount : playedFromSongs;

		return total > 0 && played >= total;
	}, [allPlayedProp, songs, roomPlayedCount]);

	const unrevealedIds = useMemo(
		() => songs?.map((s) => s.id).filter((id) => !revealedSubmitters.includes(id)) ?? [],
		[songs, revealedSubmitters]
	);
	const nextUnrevealedId = unrevealedIds[0] ?? null;
	const allSubmittersRevealed = unrevealedIds.length === 0;

	const revealOne = (songId: number) => {
		if (!effectiveAllPlayed || revealedSubmitters.includes(songId) || !room) return;
		socket.emit("revealSubmitter", { code: room.code, songId });
		setRevealedSubmitters([...revealedSubmitters, songId]); // optimistic
	};

	const revealNextSubmitter = () => {
		if (nextUnrevealedId !== null) revealOne(nextUnrevealedId);
	};

	// ---- it's safe to early-return after hooks ----
	if (!room) return null;

	return (
		<aside className="order-2 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col">
			<div className="mb-3 sm:mb-4">
				<h2 className="text-lg sm:text-xl font-semibold text-text">Playlist</h2>
			</div>

			<div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto max-h-56 sm:max-h-72 lg:max-h-none">
				{songs.map((s, idx) => {
					const isCurrent = currentSongId === s.id;
					const isTitleRevealed = revealedIds.includes(s.id);
					const isSubmitterRevealed = revealedSubmitters.includes(s.id);

					return (
						<button
							key={s.id}
							onClick={() => onSelect(s)}
							className={`w-full text-left rounded-lg border border-border px-3 py-2.5 transition
                ${isCurrent ? "bg-primary/15 border-primary" : "bg-card/50 hover:bg-card/70"}`}
						>
							<div className="flex items-center gap-2">
								<span className="font-mono text-secondary">{idx + 1}.</span>
								<span className="font-medium">
									{isTitleRevealed ? s.title ?? s.url : "Guess the song"}
								</span>
							</div>

							{isSubmitterRevealed && (
								<div className="mt-1 text-sm sm:text-base text-text">
									Submitted by{" "}
									<span className="font-semibold">{s.submitter ?? "Unknown"}</span>
								</div>
							)}
						</button>
					);
				})}
			</div>

			{/* Bottom center button: HIDDEN until all tracks are played */}
			{effectiveAllPlayed && !allSubmittersRevealed && (
				<div className="mt-4 flex justify-center">
					<Button variant="secondary" size="md" onClick={revealNextSubmitter} className="min-w-52">
						{`Reveal submitter #${songs.findIndex((s) => s.id === nextUnrevealedId) + 1}`}
					</Button>
				</div>
			)}

			{/* Optional: once everything is revealed, show a subtle completion note */}
			{effectiveAllPlayed && allSubmittersRevealed && (
				<p className="mt-4 text-xs sm:text-sm text-text-muted text-center">
					All submitters revealed.
				</p>
			)}
		</aside>
	);
}
