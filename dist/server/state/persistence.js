"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStatePersistence = initStatePersistence;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const saveBus_1 = require("./saveBus");
const roomStore_1 = require("@/server/store/roomStore");
const gameState_1 = require("./gameState");
const game_1 = require("@/lib/game");
const theme_1 = require("@/lib/theme");
const DEFAULT_STATE_PATH = path_1.default.join(process.cwd(), "data", "state.json");
const ROOM_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const normalizeCode = (code) => code.trim().toUpperCase();
const filterRecordByCodes = (record, codes) => {
    const next = {};
    for (const [code, value] of Object.entries(record !== null && record !== void 0 ? record : {})) {
        if (codes.has(normalizeCode(code)))
            next[normalizeCode(code)] = value;
    }
    return next;
};
const pruneSnapshot = (snapshot) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const now = Date.now();
    const keptRooms = [];
    const keptCodes = new Set();
    for (const room of (_a = snapshot.roomStore.rooms) !== null && _a !== void 0 ? _a : []) {
        const updatedAt = (_c = (_b = room.updatedAt) !== null && _b !== void 0 ? _b : room.createdAt) !== null && _c !== void 0 ? _c : 0;
        if (!updatedAt || now - updatedAt <= ROOM_TTL_MS) {
            keptRooms.push(room);
            keptCodes.add(normalizeCode(room.code));
        }
    }
    const pruned = Object.assign(Object.assign({}, snapshot), { roomStore: Object.assign(Object.assign({}, snapshot.roomStore), { rooms: keptRooms }), gameState: filterRecordByCodes(snapshot.gameState, keptCodes), rounds: filterRecordByCodes(snapshot.rounds, keptCodes), theme: {
            solvedBy: filterRecordByCodes((_e = (_d = snapshot.theme) === null || _d === void 0 ? void 0 : _d.solvedBy) !== null && _e !== void 0 ? _e : {}, keptCodes),
            lockedThisRound: filterRecordByCodes((_g = (_f = snapshot.theme) === null || _f === void 0 ? void 0 : _f.lockedThisRound) !== null && _g !== void 0 ? _g : {}, keptCodes),
            revealed: filterRecordByCodes((_j = (_h = snapshot.theme) === null || _h === void 0 ? void 0 : _h.revealed) !== null && _j !== void 0 ? _j : {}, keptCodes),
            hint: filterRecordByCodes((_l = (_k = snapshot.theme) === null || _k === void 0 ? void 0 : _k.hint) !== null && _l !== void 0 ? _l : {}, keptCodes),
        } });
    const removedCount = ((_o = (_m = snapshot.roomStore.rooms) === null || _m === void 0 ? void 0 : _m.length) !== null && _o !== void 0 ? _o : 0) - keptRooms.length;
    return { pruned, removedCount };
};
const ensureDir = (filePath) => {
    const dir = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
};
const readStateFile = (filePath) => {
    if (!fs_1.default.existsSync(filePath))
        return null;
    try {
        const raw = fs_1.default.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== 1)
            return null;
        return parsed;
    }
    catch (err) {
        console.warn("Warning: Failed to read persisted state:", err);
        return null;
    }
};
const writeStateFile = (filePath) => {
    const snapshot = {
        version: 1,
        savedAt: Date.now(),
        roomStore: (0, roomStore_1.exportRoomStoreState)(),
        gameState: (0, gameState_1.exportGameState)(),
        rounds: (0, game_1.exportRoundsState)(),
        theme: (0, theme_1.exportThemeState)(),
    };
    ensureDir(filePath);
    const tempPath = `${filePath}.tmp`;
    fs_1.default.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
    fs_1.default.renameSync(tempPath, filePath);
};
function initStatePersistence(options) {
    var _a, _b;
    const filePath = (_a = options === null || options === void 0 ? void 0 : options.filePath) !== null && _a !== void 0 ? _a : DEFAULT_STATE_PATH;
    const debounceMs = (_b = options === null || options === void 0 ? void 0 : options.debounceMs) !== null && _b !== void 0 ? _b : 500;
    let saveTimer = null;
    const restore = () => {
        const snapshot = readStateFile(filePath);
        if (!snapshot)
            return;
        const { pruned, removedCount } = pruneSnapshot(snapshot);
        (0, roomStore_1.importRoomStoreState)(pruned.roomStore);
        (0, gameState_1.importGameState)(pruned.gameState);
        (0, game_1.importRoundsState)(pruned.rounds);
        (0, theme_1.importThemeState)(pruned.theme);
        if (removedCount > 0) {
            writeStateFile(filePath);
        }
    };
    const scheduleSave = () => {
        if (saveTimer)
            clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveTimer = null;
            writeStateFile(filePath);
        }, debounceMs);
    };
    restore();
    (0, saveBus_1.setStateSaveHandler)(scheduleSave);
    return {
        flush: () => writeStateFile(filePath),
    };
}
