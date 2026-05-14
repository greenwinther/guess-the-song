import type { Room, RoomScoring } from "@/types/room";

const DEFAULT_ROOM_SCORING: RoomScoring = {
	guessPoints: 1,
	detailGuessPoints: 1,
	themeGuessPoints: 1,
	hardcoreMultiplier: 1.5,
};

export function createInitialRoom(code: string): Room {
	return {
		id: 0,
		code: code.toUpperCase(),
		theme: "",
		backgroundUrl: null,
		hardcoreRequired: false,
		scoring: { ...DEFAULT_ROOM_SCORING },
		players: [],
		songs: [],
	};
}
