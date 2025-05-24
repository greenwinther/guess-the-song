// src/contexts/GameContext.tsx
"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";

export type Player = { name: string };
export type Song = { id: number; url: string; submitter: string };

export type RoomState = {
	code: string;
	theme: string;
	backgroundUrl?: string;
	players: Player[];
	songs: Song[];
};

type State = { room: RoomState | null };

type Action =
	| { type: "SET_ROOM"; room: RoomState }
	| { type: "ADD_PLAYER"; player: Player }
	| { type: "SET_PLAYERS"; players: Player[] }
	| { type: "ADD_SONG"; song: Song }
	| { type: "SET_SONGS"; songs: Song[] };

const initialState: State = { room: null };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "SET_ROOM":
			return { room: action.room };
		case "ADD_PLAYER":
			return state.room
				? { room: { ...state.room, players: [...state.room.players, action.player] } }
				: state;
		case "SET_PLAYERS":
			return state.room ? { room: { ...state.room, players: action.players } } : state;
		case "ADD_SONG":
			return state.room
				? { room: { ...state.room, songs: [...state.room.songs, action.song] } }
				: state;
		case "SET_SONGS":
			return state.room ? { room: { ...state.room, songs: action.songs } } : state;
		default:
			return state;
	}
}

const GameContext = createContext<{
	state: State;
	dispatch: React.Dispatch<Action>;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(reducer, initialState);
	return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
	const ctx = useContext(GameContext);
	if (!ctx) throw new Error("useGame must be used within GameProvider");
	return ctx;
}
