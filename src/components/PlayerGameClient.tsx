"use client";
// src/components/PlayerGameClient.tsx

import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useSocket } from "@/contexts/SocketContext";
import Button from "./ui/Button";
import { Player } from "@/types/room";

interface Props {
	code: string;
	playerName: string;
}

type Item = { id: string; name: string };

export default function PlayerGameClient({ code, playerName }: Props) {
	const socket = useSocket();
	const { state, dispatch } = useGame();
	const [order, setOrder] = useState<Item[]>([]);
	const [locked, setLocked] = useState(false);

	// Utility to shuffle an array
	function shuffleArray<T>(arr: T[]): T[] {
		return arr
			.map((a) => [Math.random(), a] as [number, T])
			.sort((a, b) => a[0] - b[0])
			.map(([, v]) => v);
	}

	// Move an item up or down by offset (+1 or -1)
	const move = (index: number, offset: number) => {
		const newOrder = [...order];
		const [moved] = newOrder.splice(index, 1);
		newOrder.splice(index + offset, 0, moved);
		setOrder(newOrder);
	};
	// When a round starts, initialize ordering
	useEffect(() => {
		if (!state.room) return;

		socket.on(
			"roundStarted",
			({ songId, clipUrl, submitters }: { songId: number; clipUrl: string; submitters: string[] }) => {
				dispatch({ type: "ROUND_STARTED", payload: { songId, clipUrl, guesses: {} } });
				// map each name to a unique, stable id
				const items: Item[] = submitters.map((name, i) => ({
					id: `${name}-${i}`, // guaranteed unique per round
					name,
				}));
				setOrder(shuffleArray(items));
				setLocked(false);
			}
		);

		socket.on("roundEnded", ({ songId, correctAnswer, scores }) => {
			dispatch({
				type: "ROUND_ENDED",
				payload: { correctAnswer, scores: scores || {} },
			});
			setLocked(true);
			// build an array of just the names in the order the player has arranged
			const nameOrder = order.map((item) => item.name);
			socket.emit("submitOrder", { code, songId, order: nameOrder, playerName }, () => {});
		});

		return () => {
			socket.off("roundStarted");
			socket.off("roundEnded");
		};
	}, [socket, state.room, dispatch, code, playerName, order]);

	if (!state.room) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg text-text">
				<p className="text-lg">Loading game…</p>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen p-8 bg-gradient-to-br from-bg to-secondary bg-no-repeat bg-cover bg-center"
			style={{ backgroundImage: `url(${state.room.backgroundUrl})`, backgroundBlendMode: "overlay" }}
		>
			<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
				{/* Left Sidebar: Room code & players */}
				<aside className="w-full lg:w-1/4 p-8 border-r border-border">
					<div className="text-center mb-6">
						<p className="text-text-muted text-sm">Room code</p>
						<p className="text-4xl font-mono font-bold text-secondary">{state.room.code}</p>
					</div>
					<ul className="space-y-2">
						{state.room.players.map((p: Player) => (
							<li key={p.id} className="flex items-center space-x-2 text-text">
								<span className="w-3 h-3 rounded-full bg-primary" />
								<span>{p.name}</span>
							</li>
						))}
					</ul>
				</aside>

				{/* Main Panel: Guess list */}
				<main className="flex-1 p-6 flex flex-col items-center">
					<h1 className="text-h1 font-display text-primary text-center mb-4">
						Guess the Submitter
					</h1>

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
											disabled={locked || idx === 0}
										>
											↑
										</Button>
										<Button
											size="sm"
											variant="secondary"
											onClick={() => move(idx, +1)}
											disabled={locked || idx === order.length - 1}
										>
											↓
										</Button>
									</div>
								</li>
							))}
						</ul>
					</div>

					{locked && (
						<div className="mt-6 text-center">
							<p className="text-lg">
								{state.scores && state.scores[playerName] > 0
									? "🎉 You guessed correctly!"
									: "😢 Your guess was incorrect."}
							</p>
						</div>
					)}
				</main>

				{/* Right Sidebar: Playlist */}
				<aside className="w-full lg:w-1/4 p-6 border-l border-border flex flex-col">
					<h2 className="text-xl font-semibold text-text mb-4">Playlist</h2>
					<div className="space-y-2 flex-1 overflow-y-auto">
						{state.room.songs.map((s) => (
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
