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
}: HostPlaylistPanelProps) {
	const { room } = useRoomState();
	const viewRoom = roomOverride ?? room;
	const canReveal = Boolean(allPlayedProp);
	const hasDetailQuestion = !!viewRoom?.detailQuestion;
	const playlistReveals = useHostPlaylistReveals({
		canReveal,
		room: viewRoom,
		songs,
	});

	// ---- it's safe to early-return after hooks ----
	if (!viewRoom) return null;

	return (
		<aside className="order-2 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col">
			<div className="mb-3 sm:mb-4">
				<h2 className="text-lg sm:text-xl font-semibold text-text">Playlist</h2>
			</div>

			<div className="space-y-2 flex-1 overflow-y-auto max-h-60 sm:max-h-80 lg:max-h-[70vh]">
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
							showSongDetails || playlistReveals.revealedSubmitters.includes(song.id)
						}
						isTitleRevealed={showSongDetails || revealedIds.includes(song.id)}
						onSelect={onSelect}
						song={song}
					/>
				))}
			</div>

			{/* Bottom center button: enabled once all tracks are played */}
			{showRevealControls &&
				(!playlistReveals.allSubmittersRevealed ||
					(hasDetailQuestion && !playlistReveals.allDetailAnswersRevealed)) && (
				<div className="mt-4 flex flex-wrap items-center justify-center gap-3">
					<Button
						variant="primary"
						size="md"
						onClick={playlistReveals.revealNextSubmitter}
						disabled={!canReveal}
						className="min-w-40"
					>
						{`Reveal submitter #${playlistReveals.nextSubmitterSongNumber ?? ""}`}
					</Button>
					{hasDetailQuestion && !playlistReveals.allDetailAnswersRevealed && (
						<Button
							variant="secondary"
							size="md"
							onClick={playlistReveals.revealNextDetailAnswer}
							disabled={!canReveal}
							className="min-w-40"
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
				<p className="mt-4 text-xs sm:text-sm text-text-muted text-center">
					All submitters revealed.
				</p>
			)}
		</aside>
	);
}

