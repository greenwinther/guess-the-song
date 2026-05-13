// src/components/host/common/HostPlaylistPanel.tsx
"use client";

import Button from "@/components/shared/Button";
import { useRoomState } from "@/contexts/gameContext";
import { useHostPlaylistReveals } from "@/hooks/host/useHostPlaylistReveals";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import HostPlaylistSongRow from "./HostPlaylistSongRow";

type HostPlaylistPanelProps = {
	songs: Submission[];
	roomOverride?: Room | null;
	revealedIds?: number[];
	currentSongId?: number | null;
	onSelect?: (song: Submission) => void;
	allPlayed?: boolean;
	showSongDetails?: boolean;
	showRevealControls?: boolean;
	useSongArtworkBackground?: boolean;
	onToggleSongArtworkBackground?: () => void;
};

export default function HostPlaylistPanel({
	songs,
	roomOverride,
	revealedIds = [],
	currentSongId = null,
	onSelect,
	allPlayed: allPlayedProp,
	showSongDetails = false,
	showRevealControls = true,
	useSongArtworkBackground,
	onToggleSongArtworkBackground,
}: HostPlaylistPanelProps) {
	const { room } = useRoomState();
	const viewRoom = roomOverride ?? room;
	const canReveal = Boolean(allPlayedProp);
	const hasDetailQuestion = !!viewRoom?.detailQuestion;
	const hideSubmitterInPlaylist = viewRoom?.phase === "REVEAL" || viewRoom?.phase === "RESULTS";
	const playlistReveals = useHostPlaylistReveals({
		canReveal,
		room: viewRoom,
		songs,
	});
	const showSubmitterRevealButton = !playlistReveals.allSubmittersRevealed;
	const showDetailRevealButton = hasDetailQuestion && !playlistReveals.allDetailAnswersRevealed;

	// ---- it's safe to early-return after hooks ----
	if (!viewRoom) return null;

	return (
		<aside className="order-2 lg:order-none w-full h-full min-h-0 lg:col-span-3 p-4 pt-5 sm:p-4 sm:pt-5 border-t lg:border-t-0 lg:border-l border-border flex flex-col gap-4">
			<div className="flex items-start justify-between gap-3 pt-1">
				<h2 className="text-lg sm:text-xl font-semibold text-text">Playlist</h2>
				{onToggleSongArtworkBackground && (
					<button
						type="button"
						className="shrink-0 rounded-md border border-border/55 bg-card/25 px-1 py-1 text-[11px] text-text/80 transition-colors hover:bg-card/40 hover:text-text"
						onClick={onToggleSongArtworkBackground}
					>
						{useSongArtworkBackground ? "Artwork: On" : "Artwork: Off"}
					</button>
				)}
			</div>

			<div className="scrollbar-hidden min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)]">
				{songs.map((song, index) => (
					<HostPlaylistSongRow
						key={song.id}
						hasDetailQuestion={hasDetailQuestion}
						index={index}
						isCurrent={currentSongId === song.id}
						isDetailRevealed={
							showSongDetails || playlistReveals.revealedDetailAnswers.includes(song.id)
						}
						isSubmitterRevealed={
							!hideSubmitterInPlaylist &&
							(showSongDetails || playlistReveals.revealedSubmitters.includes(song.id))
						}
						isTitleRevealed={showSongDetails || revealedIds.includes(song.id)}
						onSelect={onSelect}
						song={song}
					/>
				))}
			</div>

			{/* Bottom center button: enabled once all tracks are played */}
			{showRevealControls && (showSubmitterRevealButton || showDetailRevealButton) && (
				<div
					className={`grid gap-2 ${
						showSubmitterRevealButton && showDetailRevealButton ? "grid-cols-2" : "grid-cols-1"
					}`}
				>
					{showSubmitterRevealButton && (
						<Button
							variant="primary"
							size="md"
							onClick={playlistReveals.revealNextSubmitter}
							disabled={!canReveal}
							className="w-full min-w-0 px-2 text-xs leading-tight sm:text-sm"
						>
							{`Reveal submitter #${playlistReveals.nextSubmitterSongNumber ?? ""}`}
						</Button>
					)}
					{showDetailRevealButton && (
						<Button
							variant="secondary"
							size="md"
							onClick={playlistReveals.revealNextDetailAnswer}
							disabled={!canReveal}
							className="w-full min-w-0 px-2 text-xs leading-tight sm:text-sm"
						>
							{`Reveal answer #${playlistReveals.nextDetailSongNumber ?? ""}`}
						</Button>
					)}
				</div>
			)}

			{/* Optional: once everything is revealed, show a subtle completion note */}
			{showRevealControls &&
				canReveal &&
				playlistReveals.allSubmittersRevealed &&
				(!hasDetailQuestion || playlistReveals.allDetailAnswersRevealed) && (
					<p className="text-xs sm:text-sm text-text-muted text-center">
						All submitters revealed.
					</p>
				)}
		</aside>
	);
}
