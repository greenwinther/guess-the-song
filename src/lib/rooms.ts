// src/lib/rooms.ts
import type { Member } from "@/types/member";
import type { RoomState } from "@/server/state/roomState";
import {
	addSong as addSongInStore,
	createRoom as createRoomInStore,
	getRoom as getRoomFromStore,
	getSong as getSongFromStore,
	joinRoom as joinRoomInStore,
	removeSong as removeSongInStore,
	setRoomTheme as setRoomThemeInStore,
} from "@/server/store/roomStore";

import type { AvatarConfig } from "@/types/avatar";

export async function createRoom(
	theme: string,
	backgroundUrl: string | null,
	hostName: string,
	avatar?: AvatarConfig
) {
	return createRoomInStore(theme, backgroundUrl, hostName, avatar);
}

export async function joinRoom(
	code: string,
	name: string,
	hardcore: boolean,
	avatar?: AvatarConfig
): Promise<{ player: Member; created: boolean }> {
	return joinRoomInStore(code, name, hardcore, avatar);
}

export async function getRoom(code: string): Promise<RoomState> {
	const room = getRoomFromStore(code);
	if (!room) throw new Error("Room not found");
	return room;
}

export async function addSong(
	code: string,
	song: { url: string; submitter: string; title: string; detailAnswer?: string | null }
) {
	return addSongInStore(code, song);
}

export async function removeSong(code: string, songId: number) {
	return removeSongInStore(code, songId);
}

export async function getSong(code: string, songId: number) {
	return getSongFromStore(code, songId);
}

export async function setRoomTheme(code: string, theme: string | null) {
	return setRoomThemeInStore(code, theme);
}
