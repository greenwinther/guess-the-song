"use client";
// src/contexts/GameContext.tsx
import { Player, Room, Song } from "@/types/room";
import { createContext, useContext, useReducer, ReactNode } from "react";

type Round = {
	songId: number;
	clipUrl: string;
	timeLimit: number;
	guesses: Record<string, string>;
};

type State = { room: Room | null; currentRound?: Round | null; scores?: Record<string, number> };

type Action =
	| { type: "SET_ROOM"; room: Room }
	| { type: "ADD_PLAYER"; player: Player }
	| { type: "SET_PLAYERS"; players: Player[] }
	| { type: "ADD_SONG"; song: Song }
	| { type: "SET_SONGS"; songs: Song[] }
	| { type: "ROUND_STARTED"; payload: Round }
	| { type: "GUESS_SUBMITTED"; payload: { player: string; guess: string } }
	| { type: "ROUND_ENDED"; payload: { correctAnswer: string; scores: Record<string, number> } };

const initialState: State = { room: null, currentRound: null, scores: {} };

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
		case "ROUND_STARTED":
			return {
				...state,
				currentRound: { ...action.payload, guesses: {} },
			};

		case "GUESS_SUBMITTED":
			if (!state.currentRound) return state;
			return {
				...state,
				currentRound: {
					...state.currentRound,
					guesses: {
						...state.currentRound.guesses,
						[action.payload.player]: action.payload.guess,
					},
				},
			};
		case "ROUND_ENDED":
			return {
				...state,
				currentRound: null,
				scores: action.payload.scores,
			};

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
