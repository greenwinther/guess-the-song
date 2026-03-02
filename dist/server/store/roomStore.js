"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = createRoom;
exports.getRoom = getRoom;
exports.joinRoom = joinRoom;
exports.removePlayerByName = removePlayerByName;
exports.setPlayerKicked = setPlayerKicked;
exports.addSong = addSong;
exports.removeSong = removeSong;
exports.getSong = getSong;
exports.setRoomTheme = setRoomTheme;
exports.setDetailQuestion = setDetailQuestion;
exports.setHardcoreRequired = setHardcoreRequired;
exports.setPlayerHardcore = setPlayerHardcore;
exports.setPlayerReady = setPlayerReady;
exports.setPlayerConnected = setPlayerConnected;
exports.setPhase = setPhase;
exports.deleteRoom = deleteRoom;
exports.iterRooms = iterRooms;
exports.exportRoomStoreState = exportRoomStoreState;
exports.importRoomStoreState = importRoomStoreState;
// src/server/store/roomStore.ts
const nanoid_1 = require("nanoid");
const saveBus_1 = require("../../server/state/saveBus");
const rooms = new Map();
let nextRoomId = 1;
let nextPlayerId = 1;
let nextSongId = 1;
const normalizeCode = (code) => code.trim().toUpperCase();
const normalizeName = (name) => name.trim().toLowerCase();
const KICK_TTL_MS = 1000 * 60 * 10; // 10 minutes
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = (0, nanoid_1.customAlphabet)(ROOM_ALPHABET, 4);
const createUniqueCode = () => {
    let code = generateCode();
    while (rooms.has(code))
        code = generateCode();
    return code;
};
const touch = (room) => {
    room.updatedAt = Date.now();
};
const pruneKicks = (room) => {
    if (!room.kicked)
        return;
    const now = Date.now();
    for (const [key, until] of Object.entries(room.kicked)) {
        if (!until || now >= until)
            delete room.kicked[key];
    }
};
function createRoom(theme, backgroundUrl, hostName, avatar) {
    const code = createUniqueCode();
    const now = Date.now();
    const roomId = nextRoomId++;
    const host = {
        id: nextPlayerId++,
        name: (hostName === null || hostName === void 0 ? void 0 : hostName.trim()) || "Host",
        isHost: true,
        roomId,
        avatar,
    };
    const room = {
        id: roomId,
        code,
        phase: "LOBBY",
        theme: (theme === null || theme === void 0 ? void 0 : theme.trim()) || undefined,
        detailQuestion: undefined,
        backgroundUrl: backgroundUrl !== null && backgroundUrl !== void 0 ? backgroundUrl : null,
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
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function getRoom(code) {
    return rooms.get(normalizeCode(code));
}
function joinRoom(code, name, hardcore, avatar) {
    var _a;
    const room = getRoom(code);
    if (!room)
        throw new Error("Room not found");
    pruneKicks(room);
    const displayName = (name === null || name === void 0 ? void 0 : name.trim()) || "Player";
    const normalized = normalizeName(displayName);
    const kickUntil = (_a = room.kicked) === null || _a === void 0 ? void 0 : _a[normalized];
    if (kickUntil && kickUntil > Date.now()) {
        throw new Error("Kicked");
    }
    const existing = room.players.find((p) => normalizeName(p.name) === normalizeName(displayName));
    if (existing) {
        if (avatar)
            existing.avatar = avatar;
        existing.connected = true;
        touch(room);
        (0, saveBus_1.notifyStateChange)();
        return { player: existing, created: false };
    }
    if (room.phase === "RESULTS") {
        throw new Error("Room closed");
    }
    const enforcedHardcore = room.rules.hardcoreRequired ? true : !!hardcore;
    const player = {
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
    (0, saveBus_1.notifyStateChange)();
    return { player, created: true };
}
function removePlayerByName(code, name) {
    const room = getRoom(code);
    if (!room)
        return null;
    const idx = room.players.findIndex((p) => normalizeName(p.name) === normalizeName(name));
    if (idx === -1)
        return null;
    const [removed] = room.players.splice(idx, 1);
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return removed !== null && removed !== void 0 ? removed : null;
}
function setPlayerKicked(code, name, until) {
    const room = getRoom(code);
    if (!room)
        return null;
    const normalized = normalizeName(name);
    if (!room.kicked)
        room.kicked = {};
    room.kicked[normalized] = until !== null && until !== void 0 ? until : Date.now() + KICK_TTL_MS;
    pruneKicks(room);
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function addSong(code, song) {
    var _a, _b, _c;
    const room = getRoom(code);
    if (!room)
        throw new Error("Room not found");
    const normalizedUrl = (_a = song.url) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (normalizedUrl) {
        const dup = room.songs.find((s) => { var _a; return ((_a = s.url) !== null && _a !== void 0 ? _a : "").trim().toLowerCase() === normalizedUrl; });
        if (dup)
            throw new Error("Duplicate song");
    }
    const created = {
        id: nextSongId++,
        url: song.url,
        submitter: song.submitter,
        title: (_b = song.title) !== null && _b !== void 0 ? _b : "",
        roomId: room.id,
        detailAnswer: (_c = song.detailAnswer) !== null && _c !== void 0 ? _c : undefined,
    };
    room.songs.push(created);
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return created;
}
function removeSong(code, songId) {
    const room = getRoom(code);
    if (!room)
        throw new Error("Room not found");
    const idx = room.songs.findIndex((s) => s.id === songId);
    if (idx === -1)
        throw new Error("Song not found");
    room.songs.splice(idx, 1);
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return songId;
}
function getSong(code, songId) {
    const room = getRoom(code);
    if (!room)
        return undefined;
    return room.songs.find((s) => s.id === songId);
}
function setRoomTheme(code, theme) {
    const room = getRoom(code);
    if (!room)
        return null;
    room.theme = (theme === null || theme === void 0 ? void 0 : theme.trim()) || undefined;
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function setDetailQuestion(code, question) {
    const room = getRoom(code);
    if (!room)
        return null;
    room.detailQuestion = (question === null || question === void 0 ? void 0 : question.trim()) || undefined;
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function setHardcoreRequired(code, required) {
    const room = getRoom(code);
    if (!room)
        return null;
    room.rules.hardcoreRequired = required;
    for (const p of room.players) {
        p.hardcore = required ? true : false;
    }
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function setPlayerHardcore(code, playerName, hardcore) {
    const room = getRoom(code);
    if (!room)
        return null;
    const player = room.players.find((p) => normalizeName(p.name) === normalizeName(playerName));
    if (!player)
        return null;
    player.hardcore = room.rules.hardcoreRequired ? true : hardcore;
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function setPlayerReady(code, playerName, ready) {
    const room = getRoom(code);
    if (!room)
        return null;
    const player = room.players.find((p) => normalizeName(p.name) === normalizeName(playerName));
    if (!player)
        return null;
    player.ready = ready;
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function setPlayerConnected(code, playerName, connected) {
    const room = getRoom(code);
    if (!room)
        return null;
    const player = room.players.find((p) => normalizeName(p.name) === normalizeName(playerName));
    if (!player)
        return null;
    player.connected = connected;
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function setPhase(code, phase) {
    const room = getRoom(code);
    if (!room)
        return null;
    room.phase = phase;
    touch(room);
    (0, saveBus_1.notifyStateChange)();
    return room;
}
function deleteRoom(code) {
    const deleted = rooms.delete(normalizeCode(code));
    if (deleted)
        (0, saveBus_1.notifyStateChange)();
    return deleted;
}
function iterRooms() {
    return rooms.entries();
}
function exportRoomStoreState() {
    return {
        rooms: Array.from(rooms.values()).map((room) => (Object.assign(Object.assign({}, room), { players: room.players.map((p) => (Object.assign({}, p))), songs: room.songs.map((s) => (Object.assign({}, s))), kicked: room.kicked ? Object.assign({}, room.kicked) : {}, rules: {
                hardcoreMultiplier: room.rules.hardcoreMultiplier,
                hardcoreRequired: room.rules.hardcoreRequired,
            } }))),
        nextRoomId,
        nextPlayerId,
        nextSongId,
    };
}
function importRoomStoreState(snapshot) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    rooms.clear();
    if (!snapshot)
        return;
    nextRoomId = (_a = snapshot.nextRoomId) !== null && _a !== void 0 ? _a : 1;
    nextPlayerId = (_b = snapshot.nextPlayerId) !== null && _b !== void 0 ? _b : 1;
    nextSongId = (_c = snapshot.nextSongId) !== null && _c !== void 0 ? _c : 1;
    for (const room of (_d = snapshot.rooms) !== null && _d !== void 0 ? _d : []) {
        const normalized = normalizeCode(room.code);
        const restored = Object.assign(Object.assign({}, room), { code: normalized, players: ((_e = room.players) !== null && _e !== void 0 ? _e : []).map((p) => {
                var _a, _b;
                return (Object.assign(Object.assign({}, p), { connected: false, ready: (_a = p.ready) !== null && _a !== void 0 ? _a : false, hardcore: (_b = p.hardcore) !== null && _b !== void 0 ? _b : false }));
            }), songs: ((_f = room.songs) !== null && _f !== void 0 ? _f : []).map((s) => (Object.assign({}, s))), kicked: room.kicked ? Object.assign({}, room.kicked) : {}, rules: {
                hardcoreMultiplier: (_h = (_g = room.rules) === null || _g === void 0 ? void 0 : _g.hardcoreMultiplier) !== null && _h !== void 0 ? _h : 1.5,
                hardcoreRequired: (_k = (_j = room.rules) === null || _j === void 0 ? void 0 : _j.hardcoreRequired) !== null && _k !== void 0 ? _k : false,
            } });
        rooms.set(normalized, restored);
    }
}
