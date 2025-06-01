"use client";
// src/components/JoinGameClient.tsx

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useSocket } from "@/contexts/SocketContext";
import { Player, Room, Song } from "@/types/room";
import { shuffleArray } from "@/utils/shuffelArray";
import { getYouTubeID } from "@/lib/youtube";
import Button from "./ui/Button";

interface Props {
	code: string;
	playerName: string;
}

type OrderItem = { id: number; name: string };

export default function JoinGameClient({ code, playerName }: Props) {
	const socket = useSocket();
	const { state, dispatch } = useGame();

	// 1) For shuffling submitters
	const [order, setOrder] = useState<OrderItem[]>([]);
	const [submitted, setSubmitted] = useState(false);

	// 2) Track which songs have been “revealed” by the host
	const [revealedSongs, setRevealedSongs] = useState<number[]>([]);

	// flag to skip that first replay
	const hasSeenFirstPlay = useRef(false);

	// 4) Holds the current background‐thumbnail URL (or null → use room.backgroundUrl)
	const [bgThumbnail, setBgThumbnail] = useState<string | null>(null);

	useEffect(() => {
		// Handler: gameStarted → seed context & reset reveals
		const onGameStarted = (room: Room) => {
			dispatch({ type: "SET_ROOM", room });
			dispatch({ type: "START_GAME" });
			setRevealedSongs([]);
			hasSeenFirstPlay.current = false;
			setBgThumbnail(null);
		};

		// Handler: roomData → seed context + build shuffled submitter order
		const onRoomData = (room: Room) => {
			dispatch({ type: "SET_ROOM", room });

			const submitterList: OrderItem[] = room.songs.map((s) => ({
				id: s.id,
				name: s.submitter,
			}));
			setOrder(shuffleArray(submitterList));
		};

		// Handler: playerJoined → add new player (reducer will dedupe)
		const onPlayerJoined = (player: Player) => {
			dispatch({ type: "ADD_PLAYER", player });
		};

		// Handler: playSong → skip the first replay, then reveal by ID
		const onPlaySong = ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			if (!hasSeenFirstPlay.current) {
				hasSeenFirstPlay.current = true;
				return;
			}
			// 1) Let context know which clip is playing
			dispatch({ type: "PLAY_SONG", payload: { songId, clipUrl } });

			// 2) Reveal this song ID in the playlist
			setRevealedSongs((prev) => (prev.includes(songId) ? prev : [...prev, songId]));

			// 3) Extract YouTube ID and set background thumbnail
			const vidId = getYouTubeID(clipUrl);
			if (vidId) {
				setBgThumbnail(`https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`);
			} else {
				setBgThumbnail(null);
			}
		};

		// Handler: gameOver → store final scores
		const onGameOver = ({ scores }: { scores: Record<string, number> }) => {
			dispatch({ type: "GAME_OVER", payload: { scores } });
		};

		// → subscribe to all
		socket.on("gameStarted", onGameStarted);
		socket.on("roomData", onRoomData);
		socket.on("playerJoined", onPlayerJoined);
		socket.on("playSong", onPlaySong);
		socket.on("gameOver", onGameOver);

		// Join the room, ask for initial roomData
		socket.emit("joinRoom", { code, name: playerName }, (ok: boolean) => {
			if (!ok) console.error("❌ Failed to join room");
		});

		return () => {
			// unsubscribe everything on cleanup
			socket.off("gameStarted", onGameStarted);
			socket.off("roomData", onRoomData);
			socket.off("playerJoined", onPlayerJoined);
			socket.off("playSong", onPlaySong);
			socket.off("gameOver", onGameOver);
		};
	}, [socket, code, playerName, dispatch]);

	// Move an item up or down by offset (+1 or -1)
	const move = (i: number, by: number) => {
		const next = [...order];
		const [m] = next.splice(i, 1);
		next.splice(i + by, 0, m);
		setOrder(next);
	};

	const handleSubmitAll = () => {
		console.log("[JoinGameClient] handleSubmit, currentClip=", state.currentClip, "order=", order);
		if (!state.room) return;

		// Build payload: for each song at index i, songId = state.room.songs[i].id, guessedName = order[i].name
		const guessesPayload: Record<string, string[]> = {};
		state.room.songs.forEach((s, idx) => {
			const guessed = order[idx]?.name || ""; // should always exist if order was initialized
			guessesPayload[s.id.toString()] = [guessed];
		});

		socket.emit("submitAllOrders", { code, playerName, guesses: guessesPayload }, (ok: boolean) => {
			if (!ok) alert("Failed to submit guesses");
			else setSubmitted(true);
		});
	};

	// ---------------- Rendering “Results” Mode ----------------
	if (state.scores && state.room && state.currentClip) {
		// Build an array of correct submitters in playlist order
		const correctList: string[] = state.room.songs.map((s) => s.submitter);
		// Count how many matches: order[idx].name === correctList[idx]
		const totalCorrect = order.reduce((sum, item, idx) => {
			return sum + (item.name === correctList[idx] ? 1 : 0);
		}, 0);

		return (
			<div
				className="min-h-screen p-8 bg-gradient-to-br from-bg to-secondary bg-no-repeat bg-cover bg-center"
				style={{
					backgroundImage: bgThumbnail ? `url(${bgThumbnail})` : `url(${state.room.backgroundUrl})`,
					backgroundBlendMode: "overlay",
				}}
			>
				<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
					{/* Left Sidebar: Room code & players */}
					<aside className="w-full lg:w-1/4 p-8 border-r border-border">
						<div className="text-center mb-6">
							<p className="text-text-muted text-sm">Room code</p>
							<p className="text-4xl font-mono font-bold text-secondary">{state.room?.code}</p>
						</div>
						<ul className="space-y-2">
							{state.room?.players.map((p: Player) => (
								<li key={p.id} className="flex items-center space-x-2 text-text">
									<span className="w-3 h-3 rounded-full bg-primary" />
									<span>{p.name}</span>
								</li>
							))}
						</ul>
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
							{state.room?.songs.map((s: Song) => (
								<div
									key={s.id}
									className="px-3 py-2 rounded-lg bg-card hover:bg-border text-text"
								>
									{revealedSongs.includes(s.id) ? s.title : "Hidden"}
								</div>
							))}
						</div>
					</aside>
				</div>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen p-8 bg-gradient-to-br from-bg to-secondary bg-no-repeat bg-cover bg-center"
			style={{
				backgroundImage: bgThumbnail ? `url(${bgThumbnail})` : `url(${state.room!.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
				{/* Left Sidebar: Room code & players */}
				<aside className="w-full lg:w-1/4 p-8 border-r border-border">
					<div className="text-center mb-6">
						<p className="text-text-muted text-sm">Room code</p>
						<p className="text-4xl font-mono font-bold text-secondary">{state.room!.code}</p>
					</div>
					<ul className="space-y-2">
						{state.room!.players.map((p: Player) => (
							<li key={p.id} className="flex items-center space-x-2 text-text">
								<span className="w-3 h-3 rounded-full bg-primary" />
								<span>{p.name}</span>
							</li>
						))}
					</ul>
				</aside>

				{/* Main Panel: Guess list */}
				<main className="flex-1 p-6 flex flex-col items-center">
					<h1 className="text-2xl font-semibold text-text mb-4">Guess the Submitter</h1>

					{/* Ordering UI */}
					<div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md">
						<ul className="space-y-4 mb-6">
							{order.map((item, idx) => (
								<li
									key={item.id}
									className="flex items-center justify-between bg-card rounded-lg p-3"
								>
									<span className="font-medium">{idx + 1}.</span>
									<span className="flex-1 mx-4">{item.name}</span>
									<div className="space-x-2">
										<Button
											size="sm"
											variant="secondary"
											onClick={() => move(idx, -1)}
											disabled={idx === 0 || submitted}
										>
											↑
										</Button>
										<Button
											size="sm"
											variant="secondary"
											onClick={() => move(idx, 1)}
											disabled={idx === order.length - 1 || submitted}
										>
											↓
										</Button>
									</div>
								</li>
							))}
						</ul>
					</div>

					{/* Submit button */}
					<div className="mt-6">
						<Button onClick={handleSubmitAll} variant="primary" size="lg" disabled={submitted}>
							{submitted ? "Order Submitted" : "Submit Order"}
						</Button>
					</div>

					{/* Final score if available */}
					{state.scores && state.scores[playerName] != null && (
						<div className="mt-6 text-center">
							<p className="text-lg">
								Your final score: <strong>{state.scores[playerName]}</strong>
							</p>
						</div>
					)}
				</main>

				{/* Right Sidebar: Playlist */}
				<aside className="w-full lg:w-1/4 p-6 border-l border-border flex flex-col">
					<h2 className="text-xl font-semibold text-text mb-4">Playlist</h2>
					<div className="space-y-2 flex-1 overflow-y-auto">
						{state.room?.songs.map((s: Song) => (
							<div
								key={s.id}
								className="px-3 py-2 rounded-lg bg-card hover:bg-border text-text"
							>
								{/* If this songId has been revealed, show title; otherwise show a placeholder */}
								{revealedSongs.includes(s.id) ? s.title : "Hidden"}
							</div>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}
