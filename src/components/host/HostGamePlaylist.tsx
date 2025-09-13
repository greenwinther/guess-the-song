// src/components/host/HostGamePlaylist.tsx
"use client";

import Button from "@/components/ui/Button";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import type { Song } from "@/types/room";

export default function HostGamePlaylist({
	songs,
	revealedIds,
	currentSongId,
	onSelect,
}: {
	songs: Song[];
	revealedIds: number[]; // already used for title reveal
	currentSongId: number | null;
	onSelect: (song: Song) => void;
}) {
	const socket = useSocket();
	const { room, revealedSubmitters = [], setRevealedSubmitters } = useGame();

	if (!room) return null;

	const revealOne = (songId: number) => {
		if (revealedSubmitters.includes(songId)) return;
		socket.emit("revealSubmitter", { code: room.code, songId });
		// Optimistic update (UI feels snappier)
		setRevealedSubmitters([...revealedSubmitters, songId]);
	};

	const revealAll = () => {
		const allIds = songs.map((s) => s.id);
		const notYet = allIds.filter((id) => !revealedSubmitters.includes(id));
		if (notYet.length === 0) return;
		socket.emit("revealAllSubmitters", { code: room.code, songIds: notYet });
		setRevealedSubmitters(Array.from(new Set([...revealedSubmitters, ...notYet])));
	};

	return (
		<aside className="order-2 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col">
			<div className="mb-3 sm:mb-4 flex items-center justify-between">
				<h2 className="text-lg sm:text-xl font-semibold text-text">Playlist</h2>
				<Button
					variant="secondary"
					size="sm"
					onClick={revealAll}
					disabled={revealedSubmitters.length === songs.length}
				>
					Reveal all submitters
				</Button>
			</div>

			<div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto max-h-56 sm:max-h-72 lg:max-h-none">
				{songs.map((s, idx) => {
					const isCurrent = currentSongId === s.id;
					const isTitleRevealed = revealedIds.includes(s.id);
					const isSubmitterRevealed = revealedSubmitters.includes(s.id);

					return (
						<div key={s.id} className="flex items-center gap-2">
							<Button
								variant={isCurrent ? "primary" : "secondary"}
								size="sm"
								className="flex-1 justify-start"
								onClick={() => onSelect(s)}
							>
								<div className="flex items-center gap-2 w-full text-left">
									<span className="font-mono text-secondary">{idx + 1}.</span>
									<span>
										{isTitleRevealed ? s.title ?? s.url : "Hidden title"}
										{isSubmitterRevealed && s.submitter ? (
											<span className="ml-2 text-xs sm:text-sm text-text font-medium">
												• The submitter is {s.submitter}
											</span>
										) : null}
									</span>
								</div>
							</Button>

							{/* Per-song reveal submitter button */}
							<Button
								variant="primary"
								size="sm"
								onClick={() => revealOne(s.id)}
								disabled={isSubmitterRevealed}
								title={isSubmitterRevealed ? "Already revealed" : "Reveal submitter"}
							>
								{isSubmitterRevealed ? "Revealed" : "Reveal"}
							</Button>
						</div>
					);
				})}
			</div>
		</aside>
	);
}
