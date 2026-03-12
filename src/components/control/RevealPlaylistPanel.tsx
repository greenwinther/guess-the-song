// src/components/control/RevealPlaylistPanel.tsx
"use client";

import Button from "@/components/ui/Button";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import type { Submission } from "@/types/submission";
import { useMemo } from "react";

export default function RevealPlaylistPanel({
	songs,
	revealedIds,
	currentSongId,
	onSelect,
	allPlayed: allPlayedProp,
}: {
	songs: Submission[];
	revealedIds: number[];
	currentSongId: number | null;
	onSelect: (song: Submission) => void;
	allPlayed?: boolean;
}) {
	const socket = useSocket();
	const { room } = useRoomState();
	const {
		revealedSubmitters = [],
		setRevealedSubmitters,
		revealedDetailAnswers = [],
		setRevealedDetailAnswers,
	} = useGameRuntime();

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
	const hasDetailQuestion = !!room?.detailQuestion;
	const detailIds = useMemo(
		() =>
			songs
				?.filter((s) => (s.detailAnswer ?? "").trim().length > 0)
				.map((s) => s.id)
				.filter((id) => !revealedDetailAnswers.includes(id)) ?? [],
		[songs, revealedDetailAnswers]
	);
	const nextUnrevealedDetailId = detailIds[0] ?? null;
	const allDetailRevealed = detailIds.length === 0;

	const revealOne = (songId: number) => {
		if (!effectiveAllPlayed || revealedSubmitters.includes(songId) || !room) return;
		socket.emit("revealSubmitter", { code: room.code, songId });
		setRevealedSubmitters([...revealedSubmitters, songId]); // optimistic
	};

	const revealNextSubmitter = () => {
		if (nextUnrevealedId !== null) revealOne(nextUnrevealedId);
	};
	const revealOneDetail = (songId: number) => {
		if (!effectiveAllPlayed || revealedDetailAnswers.includes(songId) || !room) return;
		setRevealedDetailAnswers([...revealedDetailAnswers, songId]);
	};
	const revealNextDetail = () => {
		if (nextUnrevealedDetailId !== null) revealOneDetail(nextUnrevealedDetailId);
	};

	// ---- it's safe to early-return after hooks ----
	if (!room) return null;

	return (
		<aside className="order-2 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col">
			<div className="mb-3 sm:mb-4">
				<h2 className="text-lg sm:text-xl font-semibold text-text">Playlist</h2>
			</div>

			<div className="space-y-2 flex-1 overflow-y-auto max-h-60 sm:max-h-80 lg:max-h-[70vh]">
				{songs.map((s, idx) => {
					const isCurrent = currentSongId === s.id;
					const isTitleRevealed = revealedIds.includes(s.id);
					const isSubmitterRevealed = revealedSubmitters.includes(s.id);
					const isDetailRevealed = revealedDetailAnswers.includes(s.id);

					return (
						<button
							key={s.id}
							onClick={() => onSelect(s)}
							className={`w-full text-left rounded-lg border border-border px-3 py-2 transition
                ${isCurrent ? "bg-primary/15 border-primary" : "bg-card/50 hover:bg-card/70"}`}
						>
							<div className="flex items-center gap-2">
								<span className="font-mono text-secondary text-xs sm:text-sm">{idx + 1}.</span>
								<span className="font-medium text-sm sm:text-base">
									{isTitleRevealed ? s.title ?? s.url : "Guess the song"}
								</span>
							</div>

							{isSubmitterRevealed && (
								<div className="mt-0.5 text-xs sm:text-sm text-text">
									Submitted by{" "}
									<span className="font-semibold">{s.submitter ?? "Unknown"}</span>
								</div>
							)}
							{hasDetailQuestion && s.detailAnswer && isDetailRevealed && (
								<div className="mt-0.5 text-xs sm:text-sm text-text">
									<span className="text-text-muted">Answer:</span>{" "}
									<span className="font-semibold">
										{s.detailAnswer}
									</span>
								</div>
							)}
						</button>
					);
				})}
			</div>

			{/* Bottom center button: enabled once all tracks are played */}
			{(!allSubmittersRevealed || (hasDetailQuestion && !allDetailRevealed)) && (
				<div className="mt-4 flex flex-wrap items-center justify-center gap-3">
					<Button
						variant="primary"
						size="md"
						onClick={revealNextSubmitter}
						disabled={!effectiveAllPlayed}
						className="min-w-40"
					>
						{`Reveal submitter #${songs.findIndex((s) => s.id === nextUnrevealedId) + 1}`}
					</Button>
					{hasDetailQuestion && !allDetailRevealed && (
						<Button
							variant="secondary"
							size="md"
							onClick={revealNextDetail}
							disabled={!effectiveAllPlayed}
							className="min-w-40"
						>
							{`Reveal answer #${
								songs.findIndex((s) => s.id === nextUnrevealedDetailId) + 1
							}`}
						</Button>
					)}
				</div>
			)}

			{/* Optional: once everything is revealed, show a subtle completion note */}
			{effectiveAllPlayed && allSubmittersRevealed && (!hasDetailQuestion || allDetailRevealed) && (
				<p className="mt-4 text-xs sm:text-sm text-text-muted text-center">
					All submitters revealed.
				</p>
			)}
		</aside>
	);
}

