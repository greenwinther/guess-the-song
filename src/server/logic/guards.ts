// src/server/logic/guards.ts
import type { Socket } from "socket.io";
import type { RoomState } from "@/server/state/roomState";
import type { Member } from "@/types/member";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@/types/socket";
import { getRoom } from "../store/roomStore";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function requireRoom(socket: TypedSocket, onError?: (reason: string) => void): RoomState | null {
	const code = socket.data.roomMeta?.code;
	if (!code) {
		onError?.("NO_ROOM");
		return null;
	}
	const room = getRoom(code);
	if (!room) {
		onError?.("NO_ROOM");
		return null;
	}
	return room;
}

export function requireMember(
	socket: TypedSocket,
	room: RoomState,
	onError?: (reason: string) => void
): Member | null {
	const playerName = socket.data.roomMeta?.playerName;
	if (!playerName) {
		onError?.("NO_MEMBER");
		return null;
	}
	const member = room.players.find((p) => p.name === playerName) ?? null;
	if (!member) {
		onError?.("NO_MEMBER");
		return null;
	}
	return member;
}

export function requireNonHostMember(
	socket: TypedSocket,
	room: RoomState,
	onError?: (reason: string) => void
): Member | null {
	const me = requireMember(socket, room, onError);
	if (!me) return null;
	if (me.isHost) {
		onError?.("HOST_NOT_ALLOWED");
		return null;
	}
	return me;
}

export function requireHost(
	socket: TypedSocket,
	room: RoomState,
	onError?: (reason: string) => void
): Member | null {
	const me = requireMember(socket, room, onError);
	if (!me) return null;
	if (!me.isHost) {
		onError?.("NOT_HOST");
		return null;
	}
	return me;
}
