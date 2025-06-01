"use client";
// src/components/JoinGameClient.tsx

import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useSocket } from "@/contexts/SocketContext";
import { Player, Room } from "@/types/room";
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
	const [order, setOrder] = useState<OrderItem[]>([]);
	const [submitted, setSubmitted] = useState(false);

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
			const items: OrderItem[] = room.songs.map((s) => ({
				id: s.id,
				name: s.submitter,
			}));
			setOrder(shuffleArray(items));
		});

		// 2) When game starts, set up submitter list
		socket.on("gameStarted", (room: Room) => {
			console.log("[JoinGameClient] gameStarted event", room);
			dispatch({ type: "START_GAME" });
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

	const handleSubmit = () => {
		console.log("[JoinGameClient] handleSubmit, currentClip=", state.currentClip, "order=", order);
		if (!state.currentClip) return;
		const guesses: Record<string, string[]> = {};
		guesses[state.currentClip.songId.toString()] = order.map((o) => o.name);

		socket.emit("submitAllOrders", { code, playerName, guesses }, (ok: boolean) => {
			console.log("[JoinGameClient] submitAllOrders callback, ok=", ok);
			if (!ok) alert("Failed to submit guesses");
			else setSubmitted(true);
		});
	};

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

				{/* Main Panel: Guess list + clip */}
				<main className="flex-1 p-6 flex flex-col items-center">
					<h1 className="text-2xl font-semibold text-text mb-4">Guess the Submitter</h1>

					{/* Ordering UI */}
					<div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md">
						<ul className="space-y-4">
							{order.map((item, idx) => (
								<li
									key={item.id}
									className="flex items-center justify-between px-4 py-3 rounded-lg bg-card hover:bg-border"
								>
									<span className="text-secondary font-medium">{idx + 1}.</span>
									<span className="flex-1 mx-4">{item.name}</span>
									<div className="space-x-1">
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
						<Button onClick={handleSubmit} variant="primary" size="lg" disabled={submitted}>
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
						{state.room!.songs.map((s) => (
							<div
								key={s.id}
								className="px-3 py-2 rounded-lg bg-card hover:bg-border text-text"
							>
								{s.title ?? s.url}
							</div>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}
