"use client";

import { useMemo } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime } from "@/contexts/gameContext";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";

type UseHostPlaylistRevealsOptions = {
	canReveal: boolean;
	room: Room | null;
	songs: Submission[];
};

export function useHostPlaylistReveals({
	canReveal,
	room,
	songs,
}: UseHostPlaylistRevealsOptions) {
	const socket = useSocket();
	const {
		revealedSubmitters = [],
		setRevealedSubmitters,
		revealedDetailAnswers = [],
		setRevealedDetailAnswers,
	} = useGameRuntime();

	const unrevealedSubmitterIds = useMemo(
		() => songs.map((song) => song.id).filter((id) => !revealedSubmitters.includes(id)),
		[songs, revealedSubmitters],
	);

	const unrevealedDetailIds = useMemo(
		() =>
			songs
				.filter((song) => (song.detailAnswer ?? "").trim().length > 0)
				.map((song) => song.id)
				.filter((id) => !revealedDetailAnswers.includes(id)),
		[songs, revealedDetailAnswers],
	);

	const nextSubmitterId = unrevealedSubmitterIds[0] ?? null;
	const nextDetailId = unrevealedDetailIds[0] ?? null;

	const revealSubmitter = (songId: number) => {
		if (!canReveal || revealedSubmitters.includes(songId) || !room) return;
		socket.emit("revealSubmitter", { code: room.code, songId });
		setRevealedSubmitters([...revealedSubmitters, songId]);
	};

	const revealDetailAnswer = (songId: number) => {
		if (!canReveal || revealedDetailAnswers.includes(songId) || !room) return;
		setRevealedDetailAnswers([...revealedDetailAnswers, songId]);
	};

	return {
		allDetailAnswersRevealed: unrevealedDetailIds.length === 0,
		allSubmittersRevealed: unrevealedSubmitterIds.length === 0,
		nextDetailSongNumber: nextDetailId === null ? null : songs.findIndex((song) => song.id === nextDetailId) + 1,
		nextSubmitterSongNumber:
			nextSubmitterId === null ? null : songs.findIndex((song) => song.id === nextSubmitterId) + 1,
		revealNextDetailAnswer: () => {
			if (nextDetailId !== null) revealDetailAnswer(nextDetailId);
		},
		revealNextSubmitter: () => {
			if (nextSubmitterId !== null) revealSubmitter(nextSubmitterId);
		},
		revealedDetailAnswers,
		revealedSubmitters,
	};
}
