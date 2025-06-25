// contexts/GameContext/index.tsx
"use client";

import { createContext, useContext } from "react";
import { useGameState } from "./useGameState";
import { GameContextType } from "./types";

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
	const gameState = useGameState();
	return <GameContext.Provider value={gameState}>{children}</GameContext.Provider>;
};

export const useGame = () => {
	const ctx = useContext(GameContext);
	if (!ctx) throw new Error("useGame must be used inside GameProvider");
	return ctx;
};
