// src/contexts/gameContext/index.tsx
"use client";

import { createContext, useContext } from "react";
import { useRoomStateValue, useRuntimeStateValue } from "./useGameState";
import { RoomStateContextType, RuntimeStateContextType } from "./types";

const RoomStateContext = createContext<RoomStateContextType | null>(null);
const RuntimeStateContext = createContext<RuntimeStateContextType | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
	const roomState = useRoomStateValue();
	const runtimeState = useRuntimeStateValue();

	return (
		<RoomStateContext.Provider value={roomState}>
			<RuntimeStateContext.Provider value={runtimeState}>{children}</RuntimeStateContext.Provider>
		</RoomStateContext.Provider>
	);
};

export const useRoomState = () => {
	const ctx = useContext(RoomStateContext);
	if (!ctx) throw new Error("useRoomState must be used inside GameProvider");
	return ctx;
};

export const useGameRuntime = () => {
	const ctx = useContext(RuntimeStateContext);
	if (!ctx) throw new Error("useGameRuntime must be used inside GameProvider");
	return ctx;
};
