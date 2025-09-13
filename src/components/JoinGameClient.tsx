"use client";

// src/components/JoinGameClient.tsx

import { useGame } from "@/contexts/tempContext";
import { useSocket } from "@/contexts/SocketContext";

import { useJoinRoomSocket } from "@/hooks/join/useJoinRoomSocket";
import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import { useRevealedSongsSync } from "@/hooks/join/useRevealedSongsSync";
import { useSubmissionOrder } from "@/hooks/join/useSubmissionOrder";

import BackgroundShell from "./ui/BackgroundShell";
import LeftSidebar from "./ui/LeftSidebar";
import RightSidebarPlaylist from "./join/RightSidebarPlaylist";
import { GuessPanel } from "./join/GuessPanel";
import { ResultsPanel } from "./join/ResultsPanel";
import type { OrderItem } from "./join/SubmissionOrderList";

interface Props {
	code: string;
	playerName: string;
}

export default function JoinGameClient({ code, playerName }: Props) {
	const socket = useSocket();

	const { room, currentClip, bgThumbnail, scores, revealedSongs, submittedPlayers } = useGame();

	// Socket + sync hooks
	useJoinRoomSocket(code, playerName);
	useRevealedSongsSync();
	const socketError = useReconnectNotice(code, playerName);

	// Local submission/order state (persisted)
	const { order, submitted, setSubmitted, handleReorder } = useSubmissionOrder(code, room ?? null);

	// Guard: no room yet
	if (!room) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-lg text-text">Reconnecting to room…</p>
			</div>
		);
	}

	// Submit guesses for all songs (keeps parity with your previous behavior)
	const handleSubmitAll = () => {
		if (!room) return;

		const guessesPayload: Record<string, string[]> = {};
		room.songs.forEach((s, idx) => {
			const guessed = order[idx]?.name || "";
			guessesPayload[s.id.toString()] = [guessed];
		});

		// Persist submitted flag immediately to survive refreshes
		try {
			localStorage.setItem(`submitted-${code}`, "true");
		} catch {}

		socket.emit("submitAllOrders", { code, playerName, guesses: guessesPayload }, (ok: boolean) => {
			if (!ok) {
				alert("Failed to submit guesses");
				try {
					localStorage.setItem(`submitted-${code}`, "false");
				} catch {}
			} else {
				setSubmitted(true);
			}
		});
	};

	const bgImage = bgThumbnail ?? room.backgroundUrl ?? null;
	const isResultsMode = Boolean(scores && currentClip);
	const correctList = room.songs.map((s) => s.submitter);

	return (
		<BackgroundShell bgImage={bgImage} socketError={socketError}>
			<LeftSidebar roomCode={room.code} players={room.players} submittedPlayers={submittedPlayers} />

			{isResultsMode ? (
				<ResultsPanel order={order} correctList={correctList} />
			) : (
				<GuessPanel
					order={order}
					submitted={submitted}
					onReorder={(o: OrderItem[]) => handleReorder(o)}
					onSubmit={handleSubmitAll}
					scoreForMe={scores?.[playerName] ?? null}
				/>
			)}

			<RightSidebarPlaylist songs={room.songs} revealedIds={revealedSongs} />
		</BackgroundShell>
	);
}
