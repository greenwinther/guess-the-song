import type { Room } from "@/types/room";
import type { RoomState } from "./roomState";

type PublicRoom = Room;

export function toPublicRoom(room: RoomState): PublicRoom {
	return {
		id: room.id,
		code: room.code,
		phase: room.phase,
		theme: room.theme,
		detailQuestion: room.detailQuestion,
		backgroundUrl: room.backgroundUrl ?? null,
		hardcoreRequired: room.rules.hardcoreRequired,
		scoring: {
			guessPoints: room.rules.guessPoints,
			detailGuessPoints: room.rules.detailGuessPoints,
			themeGuessPoints: room.rules.themeGuessPoints,
			hardcoreMultiplier: room.rules.hardcoreMultiplier,
		},
		players: room.players.map((p) => ({ ...p })),
		songs: room.songs.map((s) => ({ ...s })),
	};
}
