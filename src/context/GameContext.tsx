// src/context/GameContext.tsx
import { Player } from "@/types/game";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface GameContextValue {
	roomId: string | null;
	player: Player | null;
	players: Player[];
	setPlayer: (player: Player | null) => void;
	setPlayers: React.Dispatch<React.SetStateAction<Player[]>>; // <--- Change here
	setRoomId: (roomId: string | null) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
	const [roomId, setRoomId] = useState<string | null>(null);
	const [player, setPlayer] = useState<Player | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);

	return (
		<GameContext.Provider value={{ roomId, player, setPlayer, setRoomId, players, setPlayers }}>
			{children}
		</GameContext.Provider>
	);
};

export const useGameContext = () => {
	const context = useContext(GameContext);
	if (!context) {
		throw new Error("useGameContext must be used within a GameProvider");
	}
	return context;
};
