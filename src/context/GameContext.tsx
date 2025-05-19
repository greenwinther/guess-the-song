// src/context/GameContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

interface Player {
	id: string;
	name: string;
	isHost: boolean;
}

interface GameContextValue {
	roomId: string | null;
	player: Player | null;
	setPlayer: (player: Player | null) => void;
	setRoomId: (roomId: string | null) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
	const [roomId, setRoomId] = useState<string | null>(null);
	const [player, setPlayer] = useState<Player | null>(null);

	return (
		<GameContext.Provider value={{ roomId, player, setPlayer, setRoomId }}>
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
