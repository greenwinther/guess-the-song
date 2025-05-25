// src/contexts/GameContext.tsx
"use client";
import { Player, Room, Song } from "@/types/room";
import { createContext, useContext, useReducer, ReactNode } from "react";

type State = { room: Room | null };
type Action =
	| { type: "SET_ROOM"; room: Room }
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

const GameContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(reducer, initialState);
	return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
	const ctx = useContext(GameContext);
	if (!ctx) throw new Error("useGame must be inside GameProvider");
	return ctx;
}
