// src/contexts/GameContext.tsx
"use client";

import { Player, Room, Song } from "@/types/room";
import { createContext, useContext, useReducer, ReactNode } from "react";

// When the host plays a new clip:
export type Clip = {
	songId: number;
	clipUrl: string;
};

type State = {
	room: Room | null;
	gameStarted: boolean;
	currentClip: Clip | null;
	guesses: Record<number, string[]>;
	scores: Record<string, number> | null;
};

const initialState: State = {
	room: null,
	gameStarted: false,
	currentClip: null,
	guesses: {},
	scores: null,
};

type Action =
	| { type: "SET_ROOM"; room: Room }
	| { type: "ADD_PLAYER"; player: Player }
	| { type: "ADD_SONG"; song: Song }
	| { type: "REMOVE_SONG"; songId: number }
	| { type: "START_GAME" }
	| { type: "PLAY_SONG"; payload: Clip }
	| { type: "SET_GUESS"; payload: { songId: number; order: string[] } }
	| { type: "GAME_OVER"; payload: { scores: Record<string, number> } };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "SET_ROOM":
			return { ...initialState, room: action.room };
		case "ADD_PLAYER":
			if (!state.room) return state;
			return {
				...state,
				room: {
					...state.room,
					players: [...state.room.players, action.player],
				},
			};
		case "ADD_SONG":
			if (!state.room) return state;
			return {
				...state,
				room: {
					...state.room,
					songs: [...state.room.songs, action.song],
				},
			};
		case "REMOVE_SONG":
			if (!state.room) return state;
			return {
				...state,
				room: {
					...state.room,
					songs: state.room.songs.filter((s) => s.id !== action.songId),
				},
			};
		case "START_GAME":
			return { ...state, gameStarted: true };
		case "PLAY_SONG":
			return {
				...state,
				currentClip: action.payload,
			};
		case "SET_GUESS":
			return {
				...state,
				guesses: {
					...state.guesses,
					[action.payload.songId]: action.payload.order,
				},
			};
		case "GAME_OVER":
			return {
				...state,
				scores: action.payload.scores,
			};
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
	if (!ctx) throw new Error("useGame must be inside GameProvider");
	return ctx;
}
