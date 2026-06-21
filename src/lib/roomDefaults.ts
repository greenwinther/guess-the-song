import { DEFAULT_ROOM_SCORING, type Room } from "@/types/room";

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
