// src/contexts/GameContext.tsx
"use client";

import { Player, Room, Song } from "@/types/room";
import { createContext, useContext, useReducer, ReactNode } from "react";

// When the host plays a new clip:
export type Clip = {
	songId: number;
	clipUrl: string;
	submitters: string[];
};

export type State = {
	room: Room | null;
	currentClip: Clip | null;
	// for each songId, what ranking the player chose
	guesses: Record<number, string[]>;
	// after host calls showResults
	scores: Record<string, number> | null;
};

type Action =
	| { type: "SET_ROOM"; room: Room }
	| { type: "ADD_PLAYER"; player: Player }
	| { type: "ADD_SONG"; song: Song }
	| { type: "REMOVE_SONG"; songId: number }
	| { type: "PLAY_SONG"; payload: Clip }
	| { type: "SET_GUESS"; payload: { songId: number; order: string[] } }
	| { type: "GAME_OVER"; payload: { scores: Record<string, number> } };

const initialState: State = {
	room: null,
	currentClip: null,
	guesses: {},
	scores: null,
};

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
