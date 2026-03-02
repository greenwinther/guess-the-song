// src/server/store/roomStore.ts
import { customAlphabet } from "nanoid";
import type { AvatarConfig } from "@/types/avatar";
import type { Member } from "@/types/member";
import type { Submission } from "@/types/submission";
import type { RoomState } from "@/server/state/roomState";
import { notifyStateChange } from "@/server/state/saveBus";

const rooms = new Map<string, RoomState>();

let nextRoomId = 1;
let nextPlayerId = 1;
let nextSongId = 1;

const normalizeCode = (code: string) => code.trim().toUpperCase();
const normalizeName = (name: string) => name.trim().toLowerCase();
const KICK_TTL_MS = 1000 * 60 * 10; // 10 minutes

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = customAlphabet(ROOM_ALPHABET, 4);

const createUniqueCode = () => {
	let code = generateCode();
	while (rooms.has(code)) code = generateCode();
	return code;
};

const touch = (room: RoomState) => {
	room.updatedAt = Date.now();
};

const pruneKicks = (room: RoomState) => {
	if (!room.kicked) return;
	const now = Date.now();
	for (const [key, until] of Object.entries(room.kicked)) {
		if (!until || now >= until) delete room.kicked[key];
	}
};

export function createRoom(
	theme: string,
	backgroundUrl: string | null,
	hostName: string,
	avatar?: AvatarConfig
): RoomState {
	const code = createUniqueCode();
	const now = Date.now();
	const roomId = nextRoomId++;

	const host: Member = {
		id: nextPlayerId++,
		name: hostName?.trim() || "Host",
		isHost: true,
		roomId,
		avatar,
	};

	const room: RoomState = {
		id: roomId,
		code,
		phase: "LOBBY",
		theme: theme?.trim() || undefined,
		detailQuestion: undefined,
		backgroundUrl: backgroundUrl ?? null,
		players: [host],
		songs: [],
		createdAt: now,
		updatedAt: now,
		kicked: {},
		rules: {
			hardcoreMultiplier: 1.5,
			hardcoreRequired: false,
		},
	};

	rooms.set(code, room);
	notifyStateChange();
	return room;
}

export function getRoom(code: string): RoomState | undefined {
	return rooms.get(normalizeCode(code));
}

export function joinRoom(code: string, name: string, hardcore: boolean, avatar?: AvatarConfig) {
	const room = getRoom(code);
	if (!room) throw new Error("Room not found");
	pruneKicks(room);

	const displayName = name?.trim() || "Player";
	const normalized = normalizeName(displayName);
	const kickUntil = room.kicked?.[normalized];
	if (kickUntil && kickUntil > Date.now()) {
		throw new Error("Kicked");
	}
	const existing = room.players.find((p) => normalizeName(p.name) === normalizeName(displayName));
	if (existing) {
		if (avatar) existing.avatar = avatar;
		existing.connected = true;
		touch(room);
		notifyStateChange();
		return { player: existing, created: false };
	}

	if (room.phase === "RESULTS") {
		throw new Error("Room closed");
	}

	const enforcedHardcore = room.rules.hardcoreRequired ? true : !!hardcore;
	const player: Member = {
		id: nextPlayerId++,
		name: displayName,
		isHost: false,
		roomId: room.id,
		hardcore: enforcedHardcore,
		ready: false,
		connected: true,
		avatar,
	};

	room.players.push(player);
	touch(room);
	notifyStateChange();
	return { player, created: true };
}

export function removePlayerByName(code: string, name: string): Member | null {
	const room = getRoom(code);
	if (!room) return null;

	const idx = room.players.findIndex((p) => normalizeName(p.name) === normalizeName(name));
	if (idx === -1) return null;

	const [removed] = room.players.splice(idx, 1);
	touch(room);
	notifyStateChange();
	return removed ?? null;
}

export function setPlayerKicked(code: string, name: string, until?: number) {
	const room = getRoom(code);
	if (!room) return null;
	const normalized = normalizeName(name);
	if (!room.kicked) room.kicked = {};
	room.kicked[normalized] = until ?? Date.now() + KICK_TTL_MS;
	pruneKicks(room);
	touch(room);
	notifyStateChange();
	return room;
}

export function addSong(
	code: string,
	song: { url: string; submitter: string; title: string | null; detailAnswer?: string | null }
): Submission {
	const room = getRoom(code);
	if (!room) throw new Error("Room not found");
	const normalizedUrl = song.url?.trim().toLowerCase();
	if (normalizedUrl) {
		const dup = room.songs.find((s) => (s.url ?? "").trim().toLowerCase() === normalizedUrl);
		if (dup) throw new Error("Duplicate song");
	}

	const created: Submission = {
		id: nextSongId++,
		url: song.url,
		submitter: song.submitter,
		title: song.title ?? "",
		roomId: room.id,
		detailAnswer: song.detailAnswer ?? undefined,
	};

	room.songs.push(created);
	touch(room);
	notifyStateChange();
	return created;
}

export function removeSong(code: string, songId: number): number {
	const room = getRoom(code);
	if (!room) throw new Error("Room not found");

	const idx = room.songs.findIndex((s) => s.id === songId);
	if (idx === -1) throw new Error("Song not found");

	room.songs.splice(idx, 1);
	touch(room);
	notifyStateChange();
	return songId;
}

export function getSong(code: string, songId: number): Submission | undefined {
	const room = getRoom(code);
	if (!room) return undefined;
	return room.songs.find((s) => s.id === songId);
}

export function setRoomTheme(code: string, theme: string | null): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	room.theme = theme?.trim() || undefined;
	touch(room);
	notifyStateChange();
	return room;
}

export function setDetailQuestion(code: string, question: string | null): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	room.detailQuestion = question?.trim() || undefined;
	touch(room);
	notifyStateChange();
	return room;
}

export function setHardcoreRequired(code: string, required: boolean): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	room.rules.hardcoreRequired = required;
	for (const p of room.players) {
		p.hardcore = required ? true : false;
	}
	touch(room);
	notifyStateChange();
	return room;
}

export function setPlayerHardcore(code: string, playerName: string, hardcore: boolean): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	const player = room.players.find((p) => normalizeName(p.name) === normalizeName(playerName));
	if (!player) return null;
	player.hardcore = room.rules.hardcoreRequired ? true : hardcore;
	touch(room);
	notifyStateChange();
	return room;
}

export function setPlayerReady(code: string, playerName: string, ready: boolean): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	const player = room.players.find((p) => normalizeName(p.name) === normalizeName(playerName));
	if (!player) return null;
	player.ready = ready;
	touch(room);
	notifyStateChange();
	return room;
}

export function setPlayerConnected(code: string, playerName: string, connected: boolean): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	const player = room.players.find((p) => normalizeName(p.name) === normalizeName(playerName));
	if (!player) return null;
	player.connected = connected;
	touch(room);
	notifyStateChange();
	return room;
}

export function setPhase(code: string, phase: RoomState["phase"]): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	room.phase = phase;
	touch(room);
	notifyStateChange();
	return room;
}


export function deleteRoom(code: string): boolean {
	const deleted = rooms.delete(normalizeCode(code));
	if (deleted) notifyStateChange();
	return deleted;
}

export function iterRooms(): IterableIterator<[string, RoomState]> {
	return rooms.entries();
}

type RoomStoreSnapshot = {
	rooms: RoomState[];
	nextRoomId: number;
	nextPlayerId: number;
	nextSongId: number;
};

export function exportRoomStoreState(): RoomStoreSnapshot {
	return {
		rooms: Array.from(rooms.values()).map((room) => ({
			...room,
			players: room.players.map((p) => ({ ...p })),
			songs: room.songs.map((s) => ({ ...s })),
			kicked: room.kicked ? { ...room.kicked } : {},
			rules: {
				hardcoreMultiplier: room.rules.hardcoreMultiplier,
				hardcoreRequired: room.rules.hardcoreRequired,
			},
		})),
		nextRoomId,
		nextPlayerId,
		nextSongId,
	};
}

export function importRoomStoreState(snapshot: RoomStoreSnapshot | null | undefined) {
	rooms.clear();
	if (!snapshot) return;

	nextRoomId = snapshot.nextRoomId ?? 1;
	nextPlayerId = snapshot.nextPlayerId ?? 1;
	nextSongId = snapshot.nextSongId ?? 1;

	for (const room of snapshot.rooms ?? []) {
		const normalized = normalizeCode(room.code);
		const restored: RoomState = {
			...room,
			code: normalized,
			players: (room.players ?? []).map((p) => ({
				...p,
				connected: false,
				ready: p.ready ?? false,
				hardcore: p.hardcore ?? false,
			})),
			songs: (room.songs ?? []).map((s) => ({ ...s })),
			kicked: room.kicked ? { ...room.kicked } : {},
			rules: {
				hardcoreMultiplier: room.rules?.hardcoreMultiplier ?? 1.5,
				hardcoreRequired: room.rules?.hardcoreRequired ?? false,
			},
		};
		rooms.set(normalized, restored);
	}
}
