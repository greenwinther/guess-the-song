"use client";
// src/components/PlayerGameClient.tsx

import { useEffect, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { useSocket } from "@/contexts/SocketContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface Props {
	code: string;
	playerName: string;
}

export default function PlayerGameClient({ code, playerName }: Props) {
	const socket = useSocket();
	const { state, dispatch } = useGame();
	const [order, setOrder] = useState<string[]>([]);
	const [locked, setLocked] = useState(false);

	// When a round starts, initialize ordering
	useEffect(() => {
		if (!state.room) return;

		socket.on("roundStarted", ({ songId, clipUrl }) => {
			// dispatch with empty guesses map
			dispatch({ type: "ROUND_STARTED", payload: { songId, clipUrl, guesses: {} } });
			// shuffle names for this round
			const names = state.room!.players.map((p) => p.name);
			setOrder(shuffleArray(names));
			setLocked(false);
		});

		socket.on("roundEnded", ({ songId, correctAnswer, scores }) => {
			dispatch({ type: "ROUND_ENDED", payload: { correctAnswer, scores: scores || {} } });
			setLocked(true);
			// auto-submit order
			socket.emit("submitOrder", { code, songId, order, playerName }, () => {});
		});

		return () => {
			socket.off("roundStarted");
			socket.off("roundEnded");
		};
	}, [socket, state.room, dispatch, code, playerName, order]);

	// Drag end handler
	const onDragEnd = (res: DropResult) => {
		if (!res.destination) return;
		const newOrder = Array.from(order);
		const [moved] = newOrder.splice(res.source.index, 1);
		newOrder.splice(res.destination.index, 0, moved);
		setOrder(newOrder);
	};

	// shuffle util
	function shuffleArray<T>(arr: T[]): T[] {
		return arr
			.map((a) => [Math.random(), a] as [number, T])
			.sort((a, b) => a[0] - b[0])
			.map(([, v]) => v);
	}

	if (!state.room || !state.currentRound) {
		return <p>Waiting for host to start the game…</p>;
	}

	return (
		<div className="min-h-screen p-8 bg-gray-50">
			<h1 className="text-4xl font-bold mb-4">Guess the Submitter</h1>
			<audio src={state.currentRound.clipUrl} controls autoPlay className="mb-6 w-full" />

			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable droppableId="names">
					{(provided) => (
						<ul
							ref={provided.innerRef}
							{...provided.droppableProps}
							className="space-y-2 max-w-md mx-auto"
						>
							{order.map((name, idx) => (
								<Draggable key={name} draggableId={name} index={idx} isDragDisabled={locked}>
									{(prov) => (
										<li
											ref={prov.innerRef}
											{...prov.draggableProps}
											{...prov.dragHandleProps}
											className={`p-2 rounded shadow flex justify-between items-center ${
												locked ? "bg-gray-200" : "bg-white cursor-move"
											}`}
										>
											<span>{idx + 1}.</span>{" "}
											<span className="flex-1 ml-2">{name}</span>
										</li>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</ul>
					)}
				</Droppable>
			</DragDropContext>

			{locked && (
				<div className="mt-6 text-center">
					<p>
						{state.scores && state.scores[playerName] > 0
							? "🎉 You guessed correctly!"
							: "😢 Your guess was incorrect."}
					</p>
				</div>
			)}
		</div>
	);
}
