import type { RoomState } from "@/server/state/roomState";

type Phase = NonNullable<RoomState["phase"]>;

export function isPhase(room: RoomState, phase: Phase | Phase[]): boolean {
	const list = Array.isArray(phase) ? phase : [phase];
	return list.includes(room.phase ?? "LOBBY");
}
