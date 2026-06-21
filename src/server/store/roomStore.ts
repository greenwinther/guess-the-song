// src/server/store/roomStore.ts
import type { AvatarConfig } from "@/types/avatar";
import type { Member } from "@/types/member";
import { DEFAULT_ROOM_SCORING, type RoomScoring } from "@/types/room";
import type { Submission } from "@/types/submission";
import type { RoomState } from "@/server/state/roomState";
import { notifyStateChange } from "@/server/state/saveBus";
import { randomBytes } from "crypto";

const rooms = new Map<string, RoomState>();

let nextRoomId = 1;
let nextPlayerId = 1;
let nextSongId = 1;

const normalizeCode = (code: string) => code.trim().toUpperCase();
const normalizeName = (name: string) => name.trim().toLowerCase();
const normalizeClientId = (clientId: string) => clientId.trim();
const KICK_TTL_MS = 1000 * 60 * 10; // 10 minutes
const DEFAULT_SCORING = DEFAULT_ROOM_SCORING;

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = () => {
	let code = "";
	for (let index = 0; index < 4; index += 1) {
		const nextIndex = Math.floor(Math.random() * ROOM_ALPHABET.length);
		code += ROOM_ALPHABET[nextIndex];
	}
	return code;
};

const createUniqueCode = () => {
	let code = generateCode();
	while (rooms.has(code)) code = generateCode();
	return code;
};
const createAccessToken = () => randomBytes(24).toString("hex");

const touch = (room: RoomState) => {
	room.updatedAt = Date.now();
};

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
	const next = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(next)) return fallback;
	return Math.min(max, Math.max(min, next));
};

export function normalizeScoringRules(scoring?: Partial<RoomScoring> | null): RoomScoring {
	const guessPoints = Math.round(clampNumber(scoring?.guessPoints, DEFAULT_SCORING.guessPoints, 0, 100));
	const detailGuessPoints = Math.round(
		clampNumber(scoring?.detailGuessPoints, DEFAULT_SCORING.detailGuessPoints, 0, 100)
	);
	const legacyThemeGuessPoints = Math.round(
		clampNumber(scoring?.themeGuessPoints, DEFAULT_SCORING.themeGuessPoints, 0, 100)
	);
	const legacyHardcoreMultiplier = clampNumber(
		scoring?.hardcoreMultiplier,
		DEFAULT_SCORING.hardcoreMultiplier,
		1,
		10
	);
	const rawRewardMode = scoring?.hardcoreRules?.rewardMode;
	const rewardMode =
		rawRewardMode === "none" || rawRewardMode === "startBonus" || rawRewardMode === "multiplier"
			? rawRewardMode
			: DEFAULT_SCORING.hardcoreRules.rewardMode;
	const rawTieBreaker = scoring?.tieBreaker;
	const tieBreaker = rawTieBreaker === "fastestCorrectLocks" ? rawTieBreaker : "none";
	const guessesPerSong = Math.round(
		clampNumber(scoring?.themeRules?.guessesPerSong, DEFAULT_SCORING.themeRules.guessesPerSong, 1, 3)
	);
	const correctThemePoints = Math.round(
		clampNumber(
			scoring?.themeRules?.correctThemePoints ?? scoring?.themeGuessPoints,
			legacyThemeGuessPoints,
			0,
			100
		)
	);
	const hardcoreMultiplier = clampNumber(
		scoring?.hardcoreRules?.multiplier ?? scoring?.hardcoreMultiplier,
		legacyHardcoreMultiplier,
		1,
		10
	);

	return {
		guessPoints,
		detailGuessPoints,
		themeGuessPoints: correctThemePoints,
		hardcoreMultiplier,
		hardcoreRules: {
			enabled: scoring?.hardcoreRules?.enabled ?? rewardMode !== "none",
			rewardMode,
			startBonusPoints: clampNumber(
				scoring?.hardcoreRules?.startBonusPoints,
				DEFAULT_SCORING.hardcoreRules.startBonusPoints,
				0,
				100
			),
			multiplier: hardcoreMultiplier,
		},
		themeRules: {
			guessesPerSong,
			correctThemePoints,
			firstCorrectThemeBonusEnabled: !!scoring?.themeRules?.firstCorrectThemeBonusEnabled,
			firstCorrectThemePoints: Math.round(
				clampNumber(
					scoring?.themeRules?.firstCorrectThemePoints,
					DEFAULT_SCORING.themeRules.firstCorrectThemePoints,
					0,
					100
				)
			),
		},
		tieBreaker,
	};
}

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
		ownerClientId: null,
		avatar,
	};

	const room: RoomState = {
		id: roomId,
		code,
		phase: "LOBBY",
		theme: theme?.trim() || undefined,
		detailQuestion: undefined,
		backgroundUrl: backgroundUrl ?? null,
		scoring: normalizeScoringRules(DEFAULT_SCORING),
		players: [host],
		songs: [],
		adminAccessToken: createAccessToken(),
		hostAccessToken: createAccessToken(),
		adminOwnerClientId: null,
		hostOwnerClientId: null,
		createdAt: now,
		updatedAt: now,
		kicked: {},
		rules: {
			...normalizeScoringRules(DEFAULT_SCORING),
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

export function bindAdminAccess(code: string, adminToken: string, clientId: string): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	const normalizedClientId = normalizeClientId(clientId ?? "");
	if (!normalizedClientId) return null;
	if (!adminToken || adminToken !== room.adminAccessToken) return null;
	if (room.adminOwnerClientId && room.adminOwnerClientId !== normalizedClientId) return null;
	room.adminOwnerClientId = room.adminOwnerClientId ?? normalizedClientId;
	touch(room);
	notifyStateChange();
	return room;
}

export function isAdminClientForRoom(code: string, clientId: string): boolean {
	const room = getRoom(code);
	if (!room) return false;
	const normalizedClientId = normalizeClientId(clientId ?? "");
	if (!normalizedClientId) return false;
	return !!room.adminOwnerClientId && room.adminOwnerClientId === normalizedClientId;
}

export function joinRoom(code: string, name: string, hardcore: boolean, avatar?: AvatarConfig) {
	return joinRoomWithIdentity(code, name, hardcore, undefined, undefined, avatar);
}

export function joinRoomWithIdentity(
	code: string,
	name: string,
	hardcore: boolean,
	clientId?: string,
	hostToken?: string,
	avatar?: AvatarConfig
) {
	const room = getRoom(code);
	if (!room) throw new Error("Room not found");
	pruneKicks(room);
	const normalizedClientId = normalizeClientId(clientId ?? "");
	if (!normalizedClientId) throw new Error("Unauthorized");
	const hasValidHostToken = Boolean(hostToken && hostToken === room.hostAccessToken);
	if (hasValidHostToken) {
		const existingHost = room.players.find((player) => player.isHost);
		if (!existingHost) throw new Error("Unauthorized");
		if (avatar && !existingHost.avatar) existingHost.avatar = avatar;
		existingHost.connected = true;
		touch(room);
		notifyStateChange();
		return { player: existingHost, created: false };
	}

	const displayName = name?.trim() || "Player";
	const normalized = normalizeName(displayName);
	const kickUntil = room.kicked?.[normalized];
	if (kickUntil && kickUntil > Date.now()) {
		throw new Error("Kicked");
	}
	const existing = room.players.find((p) => normalizeName(p.name) === normalizeName(displayName));
	if (existing) {
		const isHost = !!existing.isHost;
		if (isHost) {
			if (!hostToken || hostToken !== room.hostAccessToken) throw new Error("Unauthorized");
		} else {
			if (existing.ownerClientId && existing.ownerClientId !== normalizedClientId) {
				throw new Error("NameTaken");
			}
		}
		if (!isHost) {
			existing.ownerClientId = existing.ownerClientId ?? normalizedClientId;
		}
		if (avatar && !existing.avatar) existing.avatar = avatar;
		existing.connected = true;
		touch(room);
		notifyStateChange();
		return { player: existing, created: false };
	}

	if (room.phase === "RESULTS" || room.phase === "ENDED") {
		throw new Error("Room closed");
	}

	const enforcedHardcore = room.rules.hardcoreRequired ? true : !!hardcore;
	const player: Member = {
		id: nextPlayerId++,
		name: displayName,
		isHost: false,
		roomId: room.id,
		ownerClientId: normalizedClientId,
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

export function updateSong(
	code: string,
	songId: number,
	song: { url: string; submitter: string; title: string | null; detailAnswer?: string | null }
): Submission {
	const room = getRoom(code);
	if (!room) throw new Error("Room not found");

	const existing = room.songs.find((item) => item.id === songId);
	if (!existing) throw new Error("Song not found");

	const normalizedUrl = song.url?.trim().toLowerCase();
	if (normalizedUrl) {
		const dup = room.songs.find(
			(item) => item.id !== songId && (item.url ?? "").trim().toLowerCase() === normalizedUrl
		);
		if (dup) throw new Error("Duplicate song");
	}

	existing.url = song.url;
	existing.submitter = song.submitter;
	existing.title = song.title ?? "";
	existing.detailAnswer = song.detailAnswer ?? undefined;
	touch(room);
	notifyStateChange();
	return { ...existing };
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

export function setScoringRules(code: string, scoring: RoomScoring): RoomState | null {
	const room = getRoom(code);
	if (!room) return null;
	const normalized = normalizeScoringRules(scoring);
	room.scoring = { ...normalized };
	room.rules = {
		...room.rules,
		...normalized,
		hardcoreRequired: room.rules.hardcoreRequired,
	};
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
			adminOwnerClientId: room.adminOwnerClientId ?? null,
			hostOwnerClientId: room.hostOwnerClientId ?? null,
			kicked: room.kicked ? { ...room.kicked } : {},
			rules: {
				...normalizeScoringRules(room.rules),
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
			scoring: normalizeScoringRules({ ...room.rules, ...room.scoring }),
			adminAccessToken: room.adminAccessToken ?? createAccessToken(),
			hostAccessToken: room.hostAccessToken ?? createAccessToken(),
			adminOwnerClientId: room.adminOwnerClientId ?? null,
			hostOwnerClientId: room.hostOwnerClientId ?? null,
			players: (room.players ?? []).map((p) => ({
				...p,
				ownerClientId: p.ownerClientId ?? null,
				connected: false,
				ready: p.ready ?? false,
				hardcore: p.hardcore ?? false,
			})),
			songs: (room.songs ?? []).map((s) => ({ ...s })),
			kicked: room.kicked ? { ...room.kicked } : {},
			rules: {
				...normalizeScoringRules({ ...room.scoring, ...room.rules }),
				hardcoreRequired: room.rules?.hardcoreRequired ?? false,
			},
		};
		rooms.set(normalized, restored);
	}
}
