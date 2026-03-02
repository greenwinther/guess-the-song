"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminDashboard = buildAdminDashboard;
exports.emitAdminDashboardToHosts = emitAdminDashboardToHosts;
const game_1 = require("../../lib/game");
const theme_1 = require("../../lib/theme");
const roomStore_1 = require("../../server/store/roomStore");
const gameState_1 = require("../../server/state/gameState");
const toGuessLabel = (order) => {
    if (!(order === null || order === void 0 ? void 0 : order.length))
        return "—";
    if (order.length === 1)
        return order[0] || "—";
    return order.filter(Boolean).join(" > ") || "—";
};
function buildAdminDashboard(code) {
    var _a, _b, _c, _d;
    const room = (0, roomStore_1.getRoom)(code);
    if (!room)
        return null;
    const game = (0, gameState_1.getRoomGameState)(code);
    const rounds = (0, game_1.getRoundsForCode)(code);
    const activeSongId = (_a = game.activeSongId) !== null && _a !== void 0 ? _a : null;
    const activeSongIndex = activeSongId != null ? room.songs.findIndex((song) => song.id === activeSongId) : -1;
    const activeRound = activeSongId != null ? rounds[activeSongId] : undefined;
    const currentSong = activeSongId != null ? room.songs.find((song) => song.id === activeSongId) : null;
    const hasDetailLane = !!room.detailQuestion &&
        room.songs.length > 0 &&
        room.songs.every((song) => { var _a; return ((_a = song.detailAnswer) !== null && _a !== void 0 ? _a : "").trim().length > 0; });
    const solved = new Set((0, theme_1.getSolvedList)(code));
    const guessedThisRound = new Set((0, theme_1.getLockedThisRoundList)(code));
    const currentSongRows = room.players
        .filter((player) => !player.isHost)
        .map((player) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const lockInfo = (_a = activeRound === null || activeRound === void 0 ? void 0 : activeRound.locks) === null || _a === void 0 ? void 0 : _a[player.name];
        const detailLockInfo = (_b = activeRound === null || activeRound === void 0 ? void 0 : activeRound.detailLocks) === null || _b === void 0 ? void 0 : _b[player.name];
        const guessOrder = (_d = (_c = activeRound === null || activeRound === void 0 ? void 0 : activeRound.orders) === null || _c === void 0 ? void 0 : _c[player.name]) !== null && _d !== void 0 ? _d : [];
        const detailOrder = (_f = (_e = activeRound === null || activeRound === void 0 ? void 0 : activeRound.detailOrders) === null || _e === void 0 ? void 0 : _e[player.name]) !== null && _f !== void 0 ? _f : [];
        return {
            playerName: player.name,
            guessOrder,
            guessLabel: toGuessLabel(guessOrder),
            locked: !!(lockInfo === null || lockInfo === void 0 ? void 0 : lockInfo.locked),
            lockedAt: (_g = lockInfo === null || lockInfo === void 0 ? void 0 : lockInfo.lockedAt) !== null && _g !== void 0 ? _g : null,
            detailOrder,
            detailLabel: toGuessLabel(detailOrder),
            detailLocked: !!(detailLockInfo === null || detailLockInfo === void 0 ? void 0 : detailLockInfo.locked),
            detailLockedAt: (_h = detailLockInfo === null || detailLockInfo === void 0 ? void 0 : detailLockInfo.lockedAt) !== null && _h !== void 0 ? _h : null,
            themeSolved: solved.has(player.name),
            themeGuessedThisRound: guessedThisRound.has(player.name),
        };
    });
    const playerHistories = room.players
        .filter((player) => !player.isHost)
        .map((player) => ({
        playerName: player.name,
        rounds: room.songs.map((song, index) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const rd = rounds[song.id];
            const lockInfo = (_a = rd === null || rd === void 0 ? void 0 : rd.locks) === null || _a === void 0 ? void 0 : _a[player.name];
            const detailLockInfo = (_b = rd === null || rd === void 0 ? void 0 : rd.detailLocks) === null || _b === void 0 ? void 0 : _b[player.name];
            const guessOrder = (_d = (_c = rd === null || rd === void 0 ? void 0 : rd.orders) === null || _c === void 0 ? void 0 : _c[player.name]) !== null && _d !== void 0 ? _d : [];
            const detailGuessOrder = (_f = (_e = rd === null || rd === void 0 ? void 0 : rd.detailOrders) === null || _e === void 0 ? void 0 : _e[player.name]) !== null && _f !== void 0 ? _f : [];
            return {
                songId: song.id,
                songIndex: index + 1,
                songTitle: (_g = song.title) !== null && _g !== void 0 ? _g : "",
                guessOrder,
                guessLabel: toGuessLabel(guessOrder),
                correctAnswer: (_j = (_h = rd === null || rd === void 0 ? void 0 : rd.correctAnswer) !== null && _h !== void 0 ? _h : song.submitter) !== null && _j !== void 0 ? _j : "",
                locked: !!(lockInfo === null || lockInfo === void 0 ? void 0 : lockInfo.locked),
                lockedAt: (_k = lockInfo === null || lockInfo === void 0 ? void 0 : lockInfo.lockedAt) !== null && _k !== void 0 ? _k : null,
                detailGuessOrder,
                detailGuessLabel: toGuessLabel(detailGuessOrder),
                detailCorrectAnswer: (_m = (_l = rd === null || rd === void 0 ? void 0 : rd.detailCorrectAnswer) !== null && _l !== void 0 ? _l : song.detailAnswer) !== null && _m !== void 0 ? _m : null,
                detailLocked: !!(detailLockInfo === null || detailLockInfo === void 0 ? void 0 : detailLockInfo.locked),
                detailLockedAt: (_o = detailLockInfo === null || detailLockInfo === void 0 ? void 0 : detailLockInfo.lockedAt) !== null && _o !== void 0 ? _o : null,
            };
        }),
    }));
    return {
        code: room.code,
        phase: (_b = room.phase) !== null && _b !== void 0 ? _b : null,
        activeSongId,
        activeSongIndex: activeSongIndex >= 0 ? activeSongIndex + 1 : null,
        currentSongTitle: (_c = currentSong === null || currentSong === void 0 ? void 0 : currentSong.title) !== null && _c !== void 0 ? _c : null,
        hasDetailLane,
        detailQuestion: (_d = room.detailQuestion) !== null && _d !== void 0 ? _d : null,
        theme: {
            enabled: !!room.theme,
            hint: (0, theme_1.getHint)(code) || null,
            revealed: (0, theme_1.isRevealed)(code),
            solvedBy: Array.from(solved),
            guessedThisRound: Array.from(guessedThisRound),
        },
        players: room.players.map((player) => ({
            id: player.id,
            name: player.name,
            isHost: !!player.isHost,
            ready: !!player.ready,
            hardcore: !!player.hardcore,
            connected: player.connected !== false,
            avatar: player.avatar,
        })),
        currentSongRows,
        playerHistories,
        updatedAt: Date.now(),
    };
}
function isHostSocketForCode(roomCode, socketLike) {
    const room = (0, roomStore_1.getRoom)(roomCode);
    const meta = socketLike.data.roomMeta;
    if (!room || !meta)
        return false;
    if (meta.code !== roomCode)
        return false;
    const member = room.players.find((player) => player.name === meta.playerName);
    return !!(member === null || member === void 0 ? void 0 : member.isHost);
}
async function emitAdminDashboardToHosts(io, code) {
    const dashboard = buildAdminDashboard(code);
    if (!dashboard)
        return;
    const sockets = await io.in(code).fetchSockets();
    for (const s of sockets) {
        if (!isHostSocketForCode(code, s))
            continue;
        s.emit("ADMIN_DASHBOARD", { dashboard });
    }
}
