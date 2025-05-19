import { useEffect, useState } from "react";
import { useSocketContext } from "../context/SocketContext";

type GamePhase = "waiting" | "guessing" | "reveal" | "finished";

export function useGame() {
	const { socket, connected } = useSocketContext();
	const [phase, setPhase] = useState<GamePhase>("waiting");
	const [players, setPlayers] = useState<string[]>([]);
	const [scores, setScores] = useState<Record<string, number>>({});

	useEffect(() => {
		if (!socket) return;

		socket.on("gamePhaseUpdate", (newPhase: GamePhase) => {
			setPhase(newPhase);
		});

		socket.on("playerListUpdate", (updatedPlayers: string[]) => {
			setPlayers(updatedPlayers);
		});

		socket.on("scoreUpdate", (updatedScores: Record<string, number>) => {
			setScores(updatedScores);
		});

		return () => {
			socket.off("gamePhaseUpdate");
			socket.off("playerListUpdate");
			socket.off("scoreUpdate");
		};
	}, [socket]);

	// Example function to join game
	const joinGame = (playerName: string) => {
		if (socket) socket.emit("joinGame", playerName);
	};

	return {
		connected,
		phase,
		players,
		scores,
		joinGame,
	};
}
