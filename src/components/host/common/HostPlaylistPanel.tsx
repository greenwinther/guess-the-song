// src/components/host/common/HostPlaylistPanel.tsx
"use client";

import Button from "@/components/shared/Button";
import PlaylistSidebar from "@/components/shared/playlist/PlaylistSidebar";
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
	const footer =
		showRevealControls && (showSubmitterRevealButton || showDetailRevealButton) ? (
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
		) : showRevealControls &&
			  canReveal &&
			  playlistReveals.allSubmittersRevealed &&
			  (!hasDetailQuestion || playlistReveals.allDetailAnswersRevealed) ? (
			<p className="text-xs sm:text-sm text-text-muted text-center">All submitters revealed.</p>
		) : null;

	return (
		<PlaylistSidebar
			onToggleSongArtworkBackground={onToggleSongArtworkBackground}
			useSongArtworkBackground={useSongArtworkBackground}
			footer={footer}
		>
			<>
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
			</>
		</PlaylistSidebar>
	);
}
