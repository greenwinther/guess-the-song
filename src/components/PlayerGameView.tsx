"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";
import { useSocket } from "@/contexts/SocketContext";

import { useJoinRoomSocket } from "@/hooks/player/useJoinRoomSocket";
import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import { useRevealedSongsSync } from "@/hooks/player/useRevealedSongsSync";
import { useSubmissionOrder } from "@/hooks/player/useSubmissionOrder";
import { useDetailOrder } from "@/hooks/player/useDetailOrder";

import BackgroundShell from "./ui/BackgroundShell";
import LeftSidebar from "./ui/LeftSidebar";
import RightSidebarPlaylist from "./player/RightSidebarPlaylist";
import { GuessPanel } from "./player/GuessPanel";
import { ResultsPanel } from "./player/ResultsPanel";
import type { OrderItem } from "./player/SubmissionOrderList";
import { useThemeSockets } from "../hooks/useThemeSockets";
import { ThemeGuessBar } from "./player/ThemeGuessBar";
import ExportGameReportButton from "./report/ExportGameReportButton";

interface Props {
	code: string;
	playerName: string;
}

export default function PlayerGameView({ code, playerName }: Props) {
	const socket = useSocket();
	const router = useRouter();
	const lastSentGuessRef = useRef<Map<number, string>>(new Map());
	const lastSentDetailGuessRef = useRef<Map<number, string>>(new Map());
	const { room } = useRoomState();
	const {
		bgThumbnail,
		scores,
		revealedSongs,
		submittedPlayers,
		solvedByTheme,
		lockedForThisRound,
	} = useGameRuntime();
	const [undoUntil, setUndoUntil] = useState<number | null>(null);
	const [detailUndoUntil, setDetailUndoUntil] = useState<number | null>(null);
	const [joinDenied, setJoinDenied] = useState<null | {
		reason: "kicked" | "closed" | "not_found" | "error";
		at: number;
	}>(null);
	const resolvedPlayerName = useMemo(() => {
		if (!room) return playerName;
		const lower = playerName.toLowerCase();
		return room.players.find((p) => p.name.toLowerCase() === lower)?.name ?? playerName;
	}, [room, playerName]);

	useEffect(() => {
		const read = () => {
			try {
				const raw = localStorage.getItem("gts-join-denied");
				if (!raw) return setJoinDenied(null);
				const parsed = JSON.parse(raw) as { reason: "kicked" | "closed" | "not_found" | "error"; at: number };
				if (!parsed?.reason) return setJoinDenied(null);
				setJoinDenied(parsed);
			} catch {
				setJoinDenied(null);
			}
		};
		read();
		const onEvent = () => read();
		window.addEventListener("gts-join-denied", onEvent);
		window.addEventListener("storage", onEvent);
		return () => {
			window.removeEventListener("gts-join-denied", onEvent);
			window.removeEventListener("storage", onEvent);
		};
	}, []);

	const { order, submitted, setSubmitted, handleReorder } = useSubmissionOrder(
		code,
		room ?? null,
		resolvedPlayerName
	);
	const { order: detailOrder, handleReorder: handleDetailReorder } = useDetailOrder(
		code,
		room ?? null,
		resolvedPlayerName
	);

	// NEW: active song id/index + locked indices
	const [currentSongId, setCurrentSongId] = useState<number | null>(null);
	const [selfLocked, setSelfLocked] = useState<Set<number>>(new Set());
	const [detailSelfLocked, setDetailSelfLocked] = useState<Set<number>>(new Set());

	const [lockedBySong, setLockedBySong] = useState<Map<number, Set<string>>>(
		new Map<number, Set<string>>()
	);
	const [detailLockedBySong, setDetailLockedBySong] = useState<Map<number, Set<string>>>(
		new Map<number, Set<string>>()
	);

	const songIndexById = useMemo(() => {
		const map = new Map<number, number>();
		room?.songs.forEach((s, i) => map.set(s.id, i));
		return map;
	}, [room?.songs]);

	const hasDetailQuestion =
		!!room?.detailQuestion &&
		(room?.songs?.length ?? 0) > 0 &&
		room?.songs.every((s) => (s.detailAnswer ?? "").trim().length > 0);

	// Re-derive self-locked indices whenever room/song mapping or snapshots change
	useEffect(() => {
		if (!room) return;
		setSelfLocked(() => {
			const next = new Set<number>();
			lockedBySong.forEach((names, songId) => {
				if (!names.has(resolvedPlayerName)) return;
				const idx = songIndexById.get(songId);
				if (idx != null) next.add(idx);
			});
			return next;
		});
	}, [room, lockedBySong, songIndexById, resolvedPlayerName]);
	useEffect(() => {
		if (!room) return;
		setDetailSelfLocked(() => {
			const next = new Set<number>();
			detailLockedBySong.forEach((names, songId) => {
				if (!names.has(resolvedPlayerName)) return;
				const idx = songIndexById.get(songId);
				if (idx != null) next.add(idx);
			});
			return next;
		});
	}, [room, detailLockedBySong, songIndexById, resolvedPlayerName]);

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

		const onLockSnapshot = ({
			songId,
			locked,
		}: {
			songId: number | null;
			locked: string[];
		}) => {
			if (!songId) return;
			// update per-song locked snapshot
			if (locked?.length) {
				setLockedBySong((prev) => {
					const m = new Map(prev);
					m.set(songId, new Set(locked));
					return m;
				});
			}
			// mark self locked if needed
			if (locked?.includes(resolvedPlayerName)) {
				const idx = songIndexById.get(songId);
				if (idx != null) setSelfLocked((prev) => new Set(prev).add(idx));
			}
		};
		const onDetailLockSnapshot = ({
			songId,
			locked,
		}: {
			songId: number | null;
			locked: string[];
		}) => {
			if (!songId) return;
			if (locked?.length) {
				setDetailLockedBySong((prev) => {
					const m = new Map(prev);
					m.set(songId, new Set(locked));
					return m;
				});
			}
			if (locked?.includes(resolvedPlayerName)) {
				const idx = songIndexById.get(songId);
				if (idx != null) setDetailSelfLocked((prev) => new Set(prev).add(idx));
			}
		};

		const onPlayerGuessLocked = ({
			songId,
			playerName: lockedBy,
		}: {
			songId: number;
			playerName: string;
		}) => {
			// self UI lock (you already have)
			if (lockedBy === resolvedPlayerName) {
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
			if (unlockedBy === resolvedPlayerName) {
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

			const idx = songIndexById.get(songId);
			if (idx == null) return;

			// 2) Mark *me* as locked, either because my name is in the snapshot
			//    or (fallback for older payloads) mode==='hardcoreOnly' && I'm HC.
			const imInSnapshot = !!lockedNames?.includes(resolvedPlayerName);
			if (imInSnapshot) {
				setSelfLocked((prev) => new Set(prev).add(idx));
				return;
			}

			if (mode === "hardcoreOnly") {
				const me = room?.players.find((p) => p.name === resolvedPlayerName);
				if (me?.hardcore) {
					setSelfLocked((prev) => new Set(prev).add(idx));
				}
			}
		};
		const onDetailFinalized = ({
			songId,
			lockedNames,
		}: {
			songId: number;
			lockedNames?: string[];
		}) => {
			if (lockedNames?.length) {
				setDetailLockedBySong((prev) => {
					const m = new Map(prev);
					const s = new Set<string>(m.get(songId) ?? new Set<string>());
					lockedNames.forEach((n) => s.add(n));
					m.set(songId, s);
					return m;
				});
			}
			const idx = songIndexById.get(songId);
			if (idx == null) return;
			if (lockedNames?.includes(resolvedPlayerName)) {
				setDetailSelfLocked((prev) => new Set(prev).add(idx));
			}
		};

		socket.on("songChanged", onSongChanged);
		socket.on("lockSnapshot", onLockSnapshot);
		socket.on("detailLockSnapshot", onDetailLockSnapshot);
		socket.on("playerGuessLocked", onPlayerGuessLocked);
		socket.on("playerGuessUndo", onPlayerGuessUndo);
		socket.on("songFinalized", onSongFinalized);
		socket.on("detailFinalized", onDetailFinalized);

		return () => {
			socket.off("songChanged", onSongChanged);
			socket.off("lockSnapshot", onLockSnapshot);
			socket.off("detailLockSnapshot", onDetailLockSnapshot);
			socket.off("playerGuessLocked", onPlayerGuessLocked);
			socket.off("playerGuessUndo", onPlayerGuessUndo);
			socket.off("songFinalized", onSongFinalized);
			socket.off("detailFinalized", onDetailFinalized);
		};
	}, [socket, songIndexById, room?.players, resolvedPlayerName]);

	// Join after listeners are set (prevents missing fast snapshots)
	useJoinRoomSocket(code, playerName);
	useRevealedSongsSync();
	useThemeSockets();
	const socketError = useReconnectNotice();

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
			socket.emit(
				"selectOrder",
				{ code, songId: currentSongId, playerName: resolvedPlayerName, order: [guess] },
				() => {
					lastSentGuessRef.current.set(currentSongId!, guess);
				}
			);
		}
	}, [socket, code, resolvedPlayerName, room, currentSongId, songIndexById, order]);

	useEffect(() => {
		if (!hasDetailQuestion) return;
		if (!socket) return;
		if (currentSongId == null) return;
		if (!room) return;

		const idx = songIndexById.get(currentSongId);
		if (idx == null) return;

		const guess = detailOrder[idx]?.name ?? "";
		const prev = lastSentDetailGuessRef.current.get(currentSongId);
		if (prev !== guess) {
			socket.emit(
				"selectDetailOrder",
				{ code, songId: currentSongId, playerName: resolvedPlayerName, order: [guess] },
				() => {
					lastSentDetailGuessRef.current.set(currentSongId!, guess);
				}
			);
		}
	}, [
		hasDetailQuestion,
		socket,
		code,
		resolvedPlayerName,
		room,
		currentSongId,
		songIndexById,
		detailOrder,
	]);

	// Guard: no room yet
	if (!room) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-lg text-text">Reconnecting to the live room...</p>
			</div>
		);
	}

	// Reorder handler -> update local + notify server for the **current** song
	const onReorder = (o: OrderItem[]) => {
		handleReorder(o);
	};
	const onDetailReorder = (o: OrderItem[]) => {
		handleDetailReorder(o);
	};

	// Lock current song answer
	const onLockCurrent = () => {
		if (currentSongId == null) return;
		socket.emit(
			"lockAnswer",
			{ code, songId: currentSongId, playerName: resolvedPlayerName },
			(ok: boolean) => {
				if (ok) {
					setSelfLocked((prev) => new Set(prev).add(currentIndex));
					setUndoUntil(Date.now() + 2000);
					setTimeout(() => setUndoUntil(null), 2000);
				}
			}
		);
	};

	const undoVisible = undoUntil != null && Date.now() < undoUntil;
	const detailUndoVisible = detailUndoUntil != null && Date.now() < detailUndoUntil;

	// Small undo (only works if server supports it)
	const onUndo = () => {
		if (currentSongId == null) return;
		socket.emit(
			"undoLock",
			{ code, songId: currentSongId, playerName: resolvedPlayerName },
			(ok: boolean) => {
				if (ok) {
					setSelfLocked((prev) => {
						const n = new Set(prev);
						n.delete(currentIndex);
						return n;
					});
					setUndoUntil(null);
				}
			}
		);
	};

	const onLockDetail = () => {
		if (currentSongId == null) return;
		socket.emit(
			"lockDetailAnswer",
			{ code, songId: currentSongId, playerName: resolvedPlayerName },
			(ok: boolean) => {
				if (ok) {
					setDetailSelfLocked((prev) => new Set(prev).add(currentIndex));
					setDetailUndoUntil(Date.now() + 2000);
					setTimeout(() => setDetailUndoUntil(null), 2000);
				}
			}
		);
	};

	const onUndoDetail = () => {
		if (currentSongId == null) return;
		socket.emit(
			"undoDetailLock",
			{ code, songId: currentSongId, playerName: resolvedPlayerName },
			(ok: boolean) => {
				if (ok) {
					setDetailSelfLocked((prev) => {
						const n = new Set(prev);
						n.delete(currentIndex);
						return n;
					});
					setDetailUndoUntil(null);
				}
			}
		);
	};

	// Old "submit all" (keep if you still want the legacy button)
	const handleSubmitAll = () => {
		if (!room) return;

		const guessesPayload: Record<string, string[]> = {};
		room.songs.forEach((s, idx) => {
			const guessed = order[idx]?.name || "";
			guessesPayload[s.id.toString()] = [guessed];
		});

		// Freeze UI immediately so players can't reorder during submit
		const prevSubmitted = submitted;
		setSubmitted(true);

		socket.emit(
			"submitAllOrders",
			{ code, playerName: resolvedPlayerName, guesses: guessesPayload },
			(ok: boolean) => {
				if (!ok) {
					setSubmitted(prevSubmitted);
					alert("Failed to submit guesses");
				}
			}
		);
	};

	const bgImage = bgThumbnail ?? room.backgroundUrl ?? null;
	const isResultsMode = room.phase === "RESULTS" && Boolean(scores);
	const correctList = room.songs.map((s) => s.submitter);

	// You can hide the legacy submit button now, since Lock is per-song
	const canLock = Boolean(order[currentIndex]?.name) && !selfLocked.has(currentIndex);
	const canLockDetail =
		hasDetailQuestion && Boolean(detailOrder[currentIndex]?.name) && !detailSelfLocked.has(currentIndex);
	const currentLockedNames = Array.from(
		lockedBySong.get(currentSongId ?? -1) ?? new Set<string>()
	);

	return (
		<BackgroundShell bgImage={bgImage} socketError={socketError}>
			{joinDenied && (
				<div className="fixed top-12 left-0 w-full bg-red-500/90 text-white text-center py-2 z-50">
					{joinDenied.reason === "kicked" && "You were kicked from this room."}
					{joinDenied.reason === "closed" && "This room is closed."}
					{joinDenied.reason === "not_found" && "Room not found."}
					{joinDenied.reason === "error" && "Unable to join room."}
					<button
						className="ml-3 underline"
						onClick={() => {
							localStorage.removeItem("gts-join-denied");
							router.push("/");
						}}
					>
						Back to start
					</button>
				</div>
			)}
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
					<>
						<ResultsPanel order={order} correctList={correctList} />
						<div className="mt-4 flex justify-center">
							<ExportGameReportButton
								code={room.code}
								scores={scores}
								theme={room.theme}
								variant="secondary"
							/>
						</div>
					</>
				) : (
					<GuessPanel
						order={order}
						detailOrder={detailOrder}
						detailQuestion={hasDetailQuestion ? room.detailQuestion : undefined}
						submitted={submitted}
						onReorder={onReorder}
						onDetailReorder={onDetailReorder}
						onLockCurrent={onLockCurrent}
						onLockDetail={onLockDetail}
						currentIndex={currentIndex}
						lockedIndices={Array.from(selfLocked)}
						detailLockedIndices={Array.from(detailSelfLocked)}
						canLock={canLock}
						canLockDetail={canLockDetail}
						undoVisible={undoVisible}
						onUndo={onUndo}
						detailUndoVisible={detailUndoVisible}
						onDetailUndo={onUndoDetail}
						onSubmitAll={handleSubmitAll}
						showSubmitAll={!submitted}
						scoreForMe={scores?.[resolvedPlayerName] ?? null}
					/>
				)}

				{/* THEME mini-game: sits UNDER the center panel */}
				<div className="mt-4">
					<ThemeGuessBar code={code} playerName={resolvedPlayerName} />
				</div>
			</main>

			{/* RIGHT */}
			<RightSidebarPlaylist songs={room.songs} revealedIds={revealedSongs} />
		</BackgroundShell>
	);
}
