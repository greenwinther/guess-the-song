"use client";
// src/components/JoinGameClient.tsx

import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useSocket } from "@/contexts/SocketContext";
import { Player, Room, Song } from "@/types/room";
import Button from "./ui/Button";
import { shuffleArray } from "@/utils/shuffelArray";

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

	// 1) On game start, initialize the order of submitters
	useEffect(() => {
		console.log("[JoinGameClient] effect mount: joining room", code, playerName);

		// 1) Join the socket room and seed initial Room state
		socket.emit("joinRoom", { code, name: playerName }, (ok: boolean) => {
			console.log("[JoinGameClient] joinRoom callback, ok=", ok);
			if (!ok) console.error("[JoinGameClient] Failed to join room");
		});

		// receive full room on join or new song/player
		socket.on("roomData", (room: Room) => {
			console.log("[JoinGameClient] roomData event", room);
			dispatch({ type: "SET_ROOM", room });

			// Build a fresh, shuffled list of submitters
			const submitterList: OrderItem[] = room.songs.map((s) => ({
				id: s.id, // song.id
				name: s.submitter,
			}));
			setOrder(shuffleArray(submitterList));
		});

		// 2) When game starts, set up submitter list
		socket.on("gameStarted", (room: Room) => {
			console.log("[JoinGameClient] gameStarted event", room);
			dispatch({ type: "START_GAME" });
		});

		// When the host “plays” a clip (reveals that song’s title)
		socket.on("playSong", ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			// 1) Let context know which clip is playing
			dispatch({ type: "PLAY_SONG", payload: { songId, clipUrl } });

			// 2) Mark this song ID as revealed, so the playlist title becomes visible
			setRevealedSongs((prev) => (prev.includes(songId) ? prev : [...prev, songId]));
		});

		// 3) When game ends, show final scores
		socket.on("gameOver", ({ scores }: { scores: Record<string, number> }) => {
			console.log("[JoinGameClient] gameOver event", scores);
			dispatch({ type: "GAME_OVER", payload: { scores } });
		});

		return () => {
			console.log("[JoinGameClient] effect cleanup: removing listeners");
			socket.off("roomData");
			socket.off("gameStarted");
			socket.off("playSong");
			socket.off("gameOver");
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
					backgroundImage: `url(${state.room?.backgroundUrl ?? ""})`,
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
			style={{ backgroundImage: `url(${state.room!.backgroundUrl})`, backgroundBlendMode: "overlay" }}
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
