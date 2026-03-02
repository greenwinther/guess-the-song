// src/server/roomStateCleanup.ts
import { clearRoomRounds } from "@/lib/game";
import { clearRoomScores } from "@/lib/score";
import { clearThemeState } from "@/lib/theme";
import { clearRoomGameState } from "./state/gameState";

export function clearRoomState(code: string) {
	clearRoomRounds(code);
	clearRoomScores(code);
	clearThemeState(code);
	clearRoomGameState(code);
}
