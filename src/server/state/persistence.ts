import fs from "fs";
import path from "path";
import { setStateSaveHandler } from "./saveBus";
import { exportRoomStoreState, importRoomStoreState } from "@/server/store/roomStore";
import { exportGameState, importGameState } from "./gameState";
import { exportRoundsState, importRoundsState } from "@/lib/game";
import { exportThemeState, importThemeState } from "@/lib/theme";
import { scopedLogger } from "../logger";

const DEFAULT_STATE_PATH = path.join(process.cwd(), "data", "state.json");
const ROOM_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const log = scopedLogger("state.persistence");

type PersistedState = {
	version: 1;
	savedAt: number;
	roomStore: ReturnType<typeof exportRoomStoreState>;
	gameState: ReturnType<typeof exportGameState>;
	rounds: ReturnType<typeof exportRoundsState>;
	theme: ReturnType<typeof exportThemeState>;
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

const filterRecordByCodes = <T extends Record<string, unknown>>(record: T, codes: Set<string>) => {
	const next: Record<string, unknown> = {};
	for (const [code, value] of Object.entries(record ?? {})) {
		if (codes.has(normalizeCode(code))) next[normalizeCode(code)] = value;
	}
	return next as T;
};

const pruneSnapshot = (snapshot: PersistedState) => {
	const now = Date.now();
	const keptRooms = [];
	const keptCodes = new Set<string>();

	for (const room of snapshot.roomStore.rooms ?? []) {
		const updatedAt = room.updatedAt ?? room.createdAt ?? 0;
		if (!updatedAt || now - updatedAt <= ROOM_TTL_MS) {
			keptRooms.push(room);
			keptCodes.add(normalizeCode(room.code));
		}
	}

	const pruned: PersistedState = {
		...snapshot,
		roomStore: {
			...snapshot.roomStore,
			rooms: keptRooms,
		},
		gameState: filterRecordByCodes(snapshot.gameState, keptCodes),
		rounds: filterRecordByCodes(snapshot.rounds, keptCodes),
		theme: {
			solvedBy: filterRecordByCodes(snapshot.theme?.solvedBy ?? {}, keptCodes),
			lockedThisRound: filterRecordByCodes(snapshot.theme?.lockedThisRound ?? {}, keptCodes),
			revealed: filterRecordByCodes(snapshot.theme?.revealed ?? {}, keptCodes),
			hint: filterRecordByCodes(snapshot.theme?.hint ?? {}, keptCodes),
		},
	};

	const removedCount = (snapshot.roomStore.rooms?.length ?? 0) - keptRooms.length;
	return { pruned, removedCount };
};

const ensureDir = (filePath: string) => {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const readStateFile = (filePath: string): PersistedState | null => {
	if (!fs.existsSync(filePath)) return null;
	try {
		const raw = fs.readFileSync(filePath, "utf8");
		const parsed = JSON.parse(raw) as PersistedState;
		if (!parsed || parsed.version !== 1) return null;
		return parsed;
	} catch (err) {
		log.warn({ err }, "failed to read persisted state");
		return null;
	}
};

const writeStateFile = (filePath: string) => {
	const snapshot: PersistedState = {
		version: 1,
		savedAt: Date.now(),
		roomStore: exportRoomStoreState(),
		gameState: exportGameState(),
		rounds: exportRoundsState(),
		theme: exportThemeState(),
	};
	ensureDir(filePath);
	const tempPath = `${filePath}.tmp`;
	fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
	fs.renameSync(tempPath, filePath);
};

export function initStatePersistence(options?: { filePath?: string; debounceMs?: number }) {
	const filePath = options?.filePath ?? DEFAULT_STATE_PATH;
	const debounceMs = options?.debounceMs ?? 500;
	let saveTimer: NodeJS.Timeout | null = null;

	const restore = () => {
		const snapshot = readStateFile(filePath);
		if (!snapshot) return;
		const { pruned, removedCount } = pruneSnapshot(snapshot);
		importRoomStoreState(pruned.roomStore);
		importGameState(pruned.gameState);
		importRoundsState(pruned.rounds);
		importThemeState(pruned.theme);
		if (removedCount > 0) {
			writeStateFile(filePath);
		}
	};

	const scheduleSave = () => {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			saveTimer = null;
			writeStateFile(filePath);
		}, debounceMs);
	};

	restore();
	setStateSaveHandler(scheduleSave);

	return {
		flush: () => writeStateFile(filePath),
	};
}
