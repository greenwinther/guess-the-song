// src/components/JoinGameClient.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
import { useThemeSockets } from "@/hooks/useThemeSockets";
import { ThemeGuessBar } from "./join/ThemeGuessBar";

interface Props {
	code: string;
	playerName: string;
}

export default function JoinGameClient({ code, playerName }: Props) {
	const socket = useSocket();
	const lastSentGuessRef = useRef<Map<number, string>>(new Map());
	const {
		room,
		currentClip,
		bgThumbnail,
		scores,
		revealedSongs,
		submittedPlayers,
		solvedByTheme,
		lockedForThisRound,
	} = useGame();
	const [undoUntil, setUndoUntil] = useState<number | null>(null);

	useJoinRoomSocket(code, playerName);
	useRevealedSongsSync();
	useThemeSockets();
	const socketError = useReconnectNotice(code, playerName);

	const { order, submitted, setSubmitted, handleReorder } = useSubmissionOrder(code, room ?? null);

	// NEW: active song id/index + locked indices
	const [currentSongId, setCurrentSongId] = useState<number | null>(null);
	const [selfLocked, setSelfLocked] = useState<Set<number>>(new Set());

	const [lockedBySong, setLockedBySong] = useState<Map<number, Set<string>>>(
		new Map<number, Set<string>>()
	);

	const songIndexById = useMemo(() => {
		const map = new Map<number, number>();
		room?.songs.forEach((s, i) => map.set(s.id, i));
		return map;
	}, [room?.songs]);

	const currentIndex = useMemo(() => {
		if (!room || currentSongId == null) return 0;
		return songIndexById.get(currentSongId) ?? 0;
	}, [room, currentSongId, songIndexById]);

	const lockedCounts = useMemo(() => {
		const acc: Record<string, number> = {};
		lockedBySong.forEach((names) => {
			names.forEach((n) => {
				acc[n] = (acc[n] || 0) + 1;
			});
		});
		return acc;
	}, [lockedBySong]);

	// Socket listeners for song lifecycle
	useEffect(() => {
		if (!socket) return;

		const onSongChanged = ({ songId }: { songId: number | null }) => {
			setCurrentSongId(songId);
		};

		const onPlayerGuessLocked = ({
			songId,
			playerName: lockedBy,
		}: {
			songId: number;
			playerName: string;
		}) => {
			// self UI lock (you already have)
			if (lockedBy === playerName) {
				const idx = songIndexById.get(songId);
				if (idx != null) setSelfLocked((prev) => new Set(prev).add(idx));
			}
			// 👇 NEW: update per-song snapshot (for counts)
			setLockedBySong((prev) => {
				const m = new Map(prev);
				const s = new Set<string>(m.get(songId) ?? new Set<string>());
				s.add(lockedBy);
				m.set(songId, s);
				return m;
			});
		};

		const onPlayerGuessUndo = ({
			songId,
			playerName: unlockedBy,
		}: {
			songId: number;
			playerName: string;
		}) => {
			if (unlockedBy === playerName) {
				const idx = songIndexById.get(songId);
				if (idx != null)
					setSelfLocked((prev) => {
						const n = new Set(prev);
						n.delete(idx);
						return n;
					});
			}
			// 👇 NEW
			setLockedBySong((prev) => {
				const m = new Map(prev);
				const s = new Set<string>(m.get(songId) ?? new Set<string>());
				s.delete(unlockedBy);
				m.set(songId, s);
				return m;
			});
		};

		// songFinalized with snapshot from the server (HC auto-locks included)
		const onSongFinalized = ({
			songId,
			lockedNames,
			mode,
		}: {
			songId: number;
			lockedNames?: string[];
			mode?: string;
		}) => {
			const idx = songIndexById.get(songId);
			if (idx == null) return;

			// 1) Always update the per-song snapshot so counts/PlayerList stay correct
			if (lockedNames?.length) {
				setLockedBySong((prev) => {
					const m = new Map(prev);
					const s = new Set<string>(m.get(songId) ?? new Set<string>());
					lockedNames.forEach((n) => s.add(n));
					m.set(songId, s);
					return m;
				});
			}

			// 2) Mark *me* as locked, either because my name is in the snapshot
			//    or (fallback for older payloads) mode==='hardcoreOnly' && I'm HC.
			const imInSnapshot = !!lockedNames?.includes(playerName);
			if (imInSnapshot) {
				setSelfLocked((prev) => new Set(prev).add(idx));
				return;
			}

			if (mode === "hardcoreOnly") {
				const me = room?.players.find((p) => p.name === playerName);
				if (me?.hardcore) {
					setSelfLocked((prev) => new Set(prev).add(idx));
				}
			}
		};

		socket.on("songChanged", onSongChanged);
		socket.on("playerGuessLocked", onPlayerGuessLocked);
		socket.on("playerGuessUndo", onPlayerGuessUndo);
		socket.on("songFinalized", onSongFinalized);

		return () => {
			socket.off("songChanged", onSongChanged);
			socket.off("playerGuessLocked", onPlayerGuessLocked);
			socket.off("playerGuessUndo", onPlayerGuessUndo);
			socket.off("songFinalized", onSongFinalized);
		};
	}, [socket, songIndexById, room?.players, playerName]);

	useEffect(() => {
		if (!socket) return;
		if (currentSongId == null) return;
		if (!room) return;

		const idx = songIndexById.get(currentSongId);
		if (idx == null) return;

		const guess = order[idx]?.name ?? "";
		const prev = lastSentGuessRef.current.get(currentSongId);

		// Only send if changed or never sent
		if (prev !== guess) {
			socket.emit("selectOrder", { code, songId: currentSongId, playerName, order: [guess] }, () => {
				lastSentGuessRef.current.set(currentSongId!, guess);
			});
		}
	}, [socket, code, playerName, room, currentSongId, songIndexById, order]);

	// Guard: no room yet
	if (!room) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-lg text-text">Reconnecting to room…</p>
			</div>
		);
	}

	// Reorder handler -> update local + notify server for the **current** song
	const onReorder = (o: OrderItem[]) => {
		handleReorder(o);
	};

	// Lock current song answer
	const onLockCurrent = () => {
		if (currentSongId == null) return;
		socket.emit("lockAnswer", { code, songId: currentSongId, playerName }, (ok: boolean) => {
			if (ok) {
				setSelfLocked((prev) => new Set(prev).add(currentIndex)); // 👈 use selfLocked
				setUndoUntil(Date.now() + 2000);
				setTimeout(() => setUndoUntil(null), 2000);
			}
		});
	};

	const undoVisible = undoUntil != null && Date.now() < undoUntil;

	// Small undo (only works if server supports it)
	const onUndo = () => {
		if (currentSongId == null) return;
		socket.emit("undoLock", { code, songId: currentSongId, playerName }, (ok: boolean) => {
			if (ok) {
				setSelfLocked((prev) => {
					// 👈 use selfLocked
					const n = new Set(prev);
					n.delete(currentIndex);
					return n;
				});
				setUndoUntil(null);
			}
		});
	};

	// Old "submit all" (keep if you still want the legacy button)
	const handleSubmitAll = () => {
		if (!room) return;

		const guessesPayload: Record<string, string[]> = {};
		room.songs.forEach((s, idx) => {
			const guessed = order[idx]?.name || "";
			guessesPayload[s.id.toString()] = [guessed];
		});

		// Freeze UI immediately so players can’t reorder during submit
		const prevSubmitted = submitted;
		setSubmitted(true);

		socket.emit("submitAllOrders", { code, playerName, guesses: guessesPayload }, (ok: boolean) => {
			if (!ok) {
				setSubmitted(prevSubmitted);
				alert("Failed to submit guesses");
			}
		});
	};

	const bgImage = bgThumbnail ?? room.backgroundUrl ?? null;
	const isResultsMode = Boolean(scores && currentClip);
	const correctList = room.songs.map((s) => s.submitter);

	// You can hide the legacy submit button now, since Lock is per-song
	const canLock = Boolean(order[currentIndex]?.name) && !selfLocked.has(currentIndex);
	const currentLockedNames = Array.from(
		lockedBySong.get(currentSongId ?? -1) ?? new Set<string>() // 👈 typed
	);

	return (
		<BackgroundShell bgImage={bgImage} socketError={socketError}>
			{/* LEFT */}
			<LeftSidebar
				roomCode={room.code}
				players={room.players}
				submittedPlayers={submittedPlayers}
				lockedNames={currentLockedNames}
				lockedCounts={lockedCounts}
				solvedByTheme={solvedByTheme}
				lockedForThisRound={lockedForThisRound}
			/>

			{/* CENTER */}
			<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col">
				{isResultsMode ? (
					<ResultsPanel order={order} correctList={correctList} />
				) : (
					<GuessPanel
						order={order}
						submitted={submitted}
						onReorder={onReorder}
						onLockCurrent={onLockCurrent}
						currentIndex={currentIndex}
						lockedIndices={Array.from(selfLocked)}
						canLock={canLock}
						undoVisible={undoVisible}
						onUndo={onUndo}
						onSubmitAll={handleSubmitAll}
						showSubmitAll={!submitted}
						scoreForMe={scores?.[playerName] ?? null}
					/>
				)}

				{/* THEME mini-game: sits UNDER the center panel */}
				<div className="mt-4">
					<ThemeGuessBar code={code} playerName={playerName} />
				</div>
			</main>

			{/* RIGHT */}
			<RightSidebarPlaylist songs={room.songs} revealedIds={revealedSongs} />
		</BackgroundShell>
	);
}
