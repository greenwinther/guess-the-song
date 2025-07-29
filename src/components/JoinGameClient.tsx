"use client";
// src/components/JoinGameClient.tsx

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/gameContext";
import { useSocket } from "@/contexts/SocketContext";
import { Player, Room, Song } from "@/types/room";
import { shuffleArray } from "@/utils/shuffelArray";
import { getYouTubeID } from "@/lib/youtube";
import Button from "./ui/Button";
import SubmissionOrderList, { OrderItem } from "./SubmissionOrderList";
import PlayerList from "./PlayerList";

interface Props {
	code: string;
	playerName: string;
}

export default function JoinGameClient({ code, playerName }: Props) {
	const socket = useSocket();
	const {
		room,
		setRoom,
		currentClip,
		setCurrentClip,
		bgThumbnail,
		setBgThumbnail,
		scores,
		setScores,
		revealedSongs,
		setRevealedSongs,
		setGameStarted,
		submittedPlayers,
		setSubmittedPlayers,
	} = useGame();

	const [order, setOrder] = useState<OrderItem[]>([]);
	const [submitted, setSubmitted] = useState(false);
	const [socketError, setSocketError] = useState<string | null>(null);
	const [hasShuffled, setHasShuffled] = useState(false);

	const roomCodeRef = useRef(code);
	const playerNameRef = useRef(playerName);
	const revealedSongsRef = useRef<number[]>([]);

	useEffect(() => {
		const onGameStarted = (room: Room) => {
			setRoom(room);
			setGameStarted(true);
			setBgThumbnail(null);
		};

		const onPlayerJoined = (player: Player) => {
			setRoom((prev) =>
				!prev || prev.players.find((p) => p.id === player.id)
					? prev
					: { ...prev, players: [...prev.players, player] }
			);
		};

		const onPlaySong = ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			setCurrentClip({ songId, clipUrl });
			const vidId = getYouTubeID(clipUrl);
			setBgThumbnail(vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : null);
		};

		const onGameOver = ({ scores }: { scores: Record<string, number> }) => {
			setScores(scores);
		};

		socket.on("gameStarted", onGameStarted);
		socket.on("playerJoined", onPlayerJoined);
		socket.on("playSong", onPlaySong);
		socket.on("gameOver", onGameOver);

		socket.emit("joinRoom", { code, name: playerName }, (ok: boolean) => {
			if (!ok) console.error("❌ Failed to join room");
		});

		return () => {
			socket.off("gameStarted", onGameStarted);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playSong", onPlaySong);
			socket.off("gameOver", onGameOver);
		};
	}, [socket, code, playerName, setRoom, setCurrentClip, setBgThumbnail, setScores, setGameStarted]);

	useEffect(() => {
		socket.on("playerLeft", (playerId: number) => {
			setRoom((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					players: prev.players.filter((p) => p.id !== playerId),
				};
			});
		});

		return () => {
			socket.off("playerLeft");
		};
	}, [socket, setRoom]);

	useEffect(() => {
		if (!room) return;

		const submittedFromStorage = localStorage.getItem(`submitted-${code}`) === "true";
		const savedOrder = localStorage.getItem(`order-${code}`);

		if (submittedFromStorage) {
			setSubmitted(true); // ✅ restore the submitted flag
		}

		if (savedOrder) {
			setOrder(JSON.parse(savedOrder));
		} else if (!submittedFromStorage) {
			const submitterList = room.songs.map((s) => ({
				id: s.id,
				name: s.submitter,
			}));
			const shuffled = shuffleArray(submitterList);
			setOrder(shuffled);
			localStorage.setItem(`order-${code}`, JSON.stringify(shuffled));
			localStorage.setItem(`shuffled-${code}`, "true");
			setHasShuffled(true);
		}
	}, [room]);

	useEffect(() => {
		const onDisconnect = (reason: any) => {
			console.warn("⚠️ socket disconnected:", reason);
			setSocketError("Connection lost. Reconnecting…");
		};

		const onReconnect = (attempt?: number) => {
			console.log("✅ socket reconnected", attempt ? `(attempt #${attempt})` : "");
			setSocketError(null);
			socket.emit("joinRoom", { code: roomCodeRef.current, name: playerNameRef.current });
		};

		socket.on("disconnect", onDisconnect);
		socket.on("connect", () => onReconnect());
		socket.on("reconnect", onReconnect);

		const mgr = (socket as any).io;
		mgr.on("connect", () => onReconnect());
		mgr.on("reconnect", onReconnect);

		return () => {
			socket.off("disconnect", onDisconnect);
			socket.off("connect", () => onReconnect());
			socket.off("reconnect", onReconnect);
			mgr.off("connect", () => onReconnect());
			mgr.off("reconnect", onReconnect);
		};
	}, [socket]);

	useEffect(() => {
		socket.on("revealedSongs", (songIds: number[]) => {
			const merged = Array.from(new Set([...revealedSongsRef.current, ...songIds]));
			revealedSongsRef.current = merged;
			setRevealedSongs(merged);
		});
		return () => {
			socket.off("revealedSongs");
		};
	}, [socket, setRevealedSongs]);

	const handleSubmitAll = () => {
		if (!room) return;
		const guessesPayload: Record<string, string[]> = {};
		room.songs.forEach((s, idx) => {
			const guessed = order[idx]?.name || "";
			guessesPayload[s.id.toString()] = [guessed];
		});
		localStorage.setItem(`submitted-${code}`, "true");
		socket.emit("submitAllOrders", { code, playerName, guesses: guessesPayload }, (ok: boolean) => {
			if (!ok) alert("Failed to submit guesses");
			else setSubmitted(true);
		});
	};

	// ─── DRAG & DROP HANDLER ─────────────────
	const handleReorder = (newOrder: OrderItem[]) => {
		setOrder(newOrder);
		localStorage.setItem(`order-${code}`, JSON.stringify(newOrder));
	};

	if (!room) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-lg text-text">Reconnecting to room…</p>
			</div>
		);
	}

	// ─── RESULTS MODE ─────────────────────────
	if (scores && room && currentClip) {
		const correctList: string[] = room.songs.map((s) => s.submitter);
		const totalCorrect = order.reduce(
			(sum, item, idx) => sum + (item.name === correctList[idx] ? 1 : 0),
			0
		);

		return (
			<div
				className="min-h-screen p-8 bg-gradient-to-br from-bg to-secondary bg-no-repeat bg-cover bg-center"
				style={{
					backgroundImage: bgThumbnail
						? `url(${bgThumbnail})`
						: room?.backgroundUrl
						? `url(${room.backgroundUrl})`
						: "none",
					backgroundBlendMode: "overlay",
				}}
			>
				{socketError && (
					<div className="fixed top-0 left-0 w-full bg-yellow-300 text-yellow-900 text-center py-2 z-50">
						{socketError}
					</div>
				)}
				<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
					{/* Left Sidebar: Room code & players */}
					<aside className="w-full lg:w-1/4 p-8 border-r border-border">
						<div className="text-center mb-6">
							<p className="text-text-muted text-sm">Room code</p>
							{room ? (
								<p className="text-4xl font-mono font-bold text-secondary">{room.code}</p>
							) : (
								<p className="text-4xl font-mono font-bold text-secondary">Loading…</p>
							)}
						</div>
						<PlayerList players={room.players} submittedPlayers={submittedPlayers} />
					</aside>

					{/* Center Panel: Show 1/0 correctness + total score */}
					<main className="flex-1 p-6 flex flex-col items-center">
						<h1 className="text-2xl font-semibold text-text mb-4">Results</h1>

						<div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md">
							<ul className="space-y-4 mb-6">
								{order.map((item, idx) => {
									// idx = song index; item.name = guessed submitter
									const isCorrect = item.name === correctList[idx];
									return (
										<li
											key={item.id}
											className="flex items-center justify-between bg-card rounded-lg p-3"
										>
											<span className="text-secondary font-medium">{idx + 1}.</span>
											<span className="flex-1 mx-4">{item.name}</span>
											<span
												className={`${
													isCorrect ? "text-green-500" : "text-red-500"
												} font-bold`}
											>
												{isCorrect ? "1" : "0"}
											</span>
										</li>
									);
								})}
							</ul>
						</div>

						<div className="mt-6 text-center">
							<p className="text-lg">
								Your total correct: <strong>{totalCorrect} pts</strong>
							</p>
						</div>
					</main>

					{/* Right Sidebar: Playlist (still show titles or “Hidden”) */}
					<aside className="w-full lg:w-1/4 p-6 border-l border-border flex flex-col">
						<h2 className="text-xl font-semibold text-text mb-4">Playlist</h2>
						<div className="space-y-2 flex-1 overflow-y-auto">
							{room?.songs.map((s: Song, idx: number) => (
								<div
									key={s.id}
									className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-card hover:bg-border text-text"
								>
									<span className="text-secondary font-mono">{idx + 1}.</span>
									<span>
										{revealedSongs.includes(s.id)
											? s.title ?? s.url
											: "Click to reveal song"}
									</span>
								</div>
							))}
						</div>
					</aside>
				</div>
			</div>
		);
	}

	// ─── GUESS MODE ───────────────────────────
	return (
		<div
			className="min-h-screen p-8 bg-gradient-to-br from-bg to-secondary bg-no-repeat bg-cover bg-center"
			style={{
				backgroundImage: bgThumbnail
					? `url(${bgThumbnail})`
					: room?.backgroundUrl
					? `url(${room.backgroundUrl})`
					: "none",
				backgroundBlendMode: "overlay",
			}}
		>
			{socketError && (
				<div className="fixed top-0 left-0 w-full bg-yellow-300 text-yellow-900 text-center py-2 z-50">
					{socketError}
				</div>
			)}
			<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
				{/* Left Sidebar: Room code & players */}
				<aside className="w-full lg:w-1/4 p-8 border-r border-border">
					<div className="text-center mb-6">
						<p className="text-text-muted text-sm">Room code</p>
						{room ? (
							<p className="text-4xl font-mono font-bold text-secondary">{room.code}</p>
						) : (
							<p className="text-4xl font-mono font-bold text-secondary">Loading…</p>
						)}
					</div>
					<PlayerList players={room.players} submittedPlayers={submittedPlayers} />
				</aside>

				{/* Main Panel: Guess list */}
				<main className="flex-1 p-6 flex flex-col items-center">
					<h1 className="text-2xl font-semibold text-text mb-4">Guess the Submitter</h1>

					{/* ── DragDropContext + Droppable + Draggable (unchanged logic) ── */}
					<SubmissionOrderList order={order} submitted={submitted} onDragEnd={handleReorder} />

					{/* Submit button */}
					<div className="mt-6">
						<Button onClick={handleSubmitAll} variant="primary" size="lg" disabled={submitted}>
							{submitted ? "Order Submitted" : "Submit Order"}
						</Button>
					</div>

					{/* Final score if available */}
					{scores && scores[playerName] != null && (
						<div className="mt-6 text-center">
							<p className="text-lg">
								Your final score: <strong>{scores[playerName]}</strong>
							</p>
						</div>
					)}
				</main>

				{/* Right Sidebar: Playlist */}
				<aside className="w-full lg:w-1/4 p-6 border-l border-border flex flex-col">
					<h2 className="text-xl font-semibold text-text mb-4">Playlist</h2>
					<div className="space-y-2 flex-1 overflow-y-auto">
						{room?.songs.map((s: Song, idx: number) => (
							<div
								key={s.id}
								className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-card hover:bg-border text-text"
							>
								<span className="text-secondary font-mono">{idx + 1}.</span>
								<span>
									{revealedSongs.includes(s.id) ? s.title ?? s.url : "Click to reveal song"}
								</span>
							</div>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}
