import type { Room } from "@/types/room";
import type { RoomState } from "./roomState";
import { normalizeScoringRules } from "@/server/store/roomStore";

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
		scoring: normalizeScoringRules(room.rules),
		players: room.players.map((p) => ({ ...p })),
		songs: room.songs.map((s) => ({ ...s })),
	};
}
