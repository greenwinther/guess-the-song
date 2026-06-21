import { DEFAULT_ROOM_SCORING, type HardcoreRewardMode, type Room, type RoomScoring, type RoomTieBreaker } from "@/types/room";

export type ExportedSong = {
	url: string;
	submitter: string;
	title: string;
	detailAnswer?: string;
};

export type AdminSetupExportV1 = {
	version: 1;
	exportedAt: string;
	source: {
		code: string;
	};
	setup: {
		theme: string;
		detailQuestion: string;
		hardcoreRequired: boolean;
		scoring: RoomScoring;
		songs: ExportedSong[];
	};
};

const isExportedSong = (value: unknown): value is ExportedSong => {
	if (!value || typeof value !== "object") return false;
	const song = value as Record<string, unknown>;
	return (
		typeof song.url === "string" &&
		typeof song.submitter === "string" &&
		typeof song.title === "string" &&
		(song.detailAnswer === undefined || typeof song.detailAnswer === "string")
	);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === "object" && !Array.isArray(value);

const readNumber = (value: unknown, fallback: number) =>
	typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readBoolean = (value: unknown, fallback: boolean) =>
	typeof value === "boolean" ? value : fallback;

const readHardcoreRewardMode = (value: unknown): HardcoreRewardMode | null =>
	value === "none" || value === "startBonus" || value === "multiplier" ? value : null;

const readTieBreaker = (value: unknown): RoomTieBreaker =>
	value === "fastestCorrectLocks" ? value : "none";

const parseSetupScoring = (value: unknown): RoomScoring => {
	if (!isRecord(value)) {
		throw new Error("Setup file has an invalid shape.");
	}

	const guessPoints = readNumber(value.guessPoints, Number.NaN);
	const detailGuessPoints = readNumber(value.detailGuessPoints, Number.NaN);
	if (!Number.isFinite(guessPoints) || !Number.isFinite(detailGuessPoints)) {
		throw new Error("Setup file has an invalid shape.");
	}

	const legacyThemeGuessPoints = readNumber(
		value.themeGuessPoints,
		DEFAULT_ROOM_SCORING.themeGuessPoints,
	);
	const legacyHardcoreMultiplier = readNumber(
		value.hardcoreMultiplier,
		DEFAULT_ROOM_SCORING.hardcoreMultiplier,
	);
	const rawHardcoreRules = isRecord(value.hardcoreRules) ? value.hardcoreRules : {};
	const rawThemeRules = isRecord(value.themeRules) ? value.themeRules : {};
	const rewardMode =
		readHardcoreRewardMode(rawHardcoreRules.rewardMode) ??
		DEFAULT_ROOM_SCORING.hardcoreRules.rewardMode;
	const hardcoreMultiplier = readNumber(rawHardcoreRules.multiplier, legacyHardcoreMultiplier);
	const correctThemePoints = readNumber(rawThemeRules.correctThemePoints, legacyThemeGuessPoints);

	return {
		guessPoints,
		detailGuessPoints,
		themeGuessPoints: correctThemePoints,
		hardcoreMultiplier,
		hardcoreRules: {
			enabled: readBoolean(rawHardcoreRules.enabled, rewardMode !== "none"),
			rewardMode,
			startBonusPoints: readNumber(
				rawHardcoreRules.startBonusPoints,
				DEFAULT_ROOM_SCORING.hardcoreRules.startBonusPoints,
			),
			multiplier: hardcoreMultiplier,
		},
		themeRules: {
			guessesPerSong: readNumber(
				rawThemeRules.guessesPerSong,
				DEFAULT_ROOM_SCORING.themeRules.guessesPerSong,
			),
			correctThemePoints,
			firstCorrectThemeBonusEnabled: readBoolean(
				rawThemeRules.firstCorrectThemeBonusEnabled,
				DEFAULT_ROOM_SCORING.themeRules.firstCorrectThemeBonusEnabled,
			),
			firstCorrectThemePoints: readNumber(
				rawThemeRules.firstCorrectThemePoints,
				DEFAULT_ROOM_SCORING.themeRules.firstCorrectThemePoints,
			),
		},
		tieBreaker: readTieBreaker(value.tieBreaker),
	};
};

export const parseAdminSetupImport = (raw: string): AdminSetupExportV1 => {
	const parsed = JSON.parse(raw) as unknown;
	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid setup file.");
	}

	const data = parsed as Record<string, unknown>;
	if (data.version !== 1) {
		throw new Error("Unsupported setup file version.");
	}

	const setup = data.setup as Record<string, unknown> | undefined;
	if (!setup || typeof setup !== "object" || !Array.isArray(setup.songs)) {
		throw new Error("Missing setup data.");
	}

	if (
		typeof setup.theme !== "string" ||
		typeof setup.detailQuestion !== "string" ||
		typeof setup.hardcoreRequired !== "boolean" ||
		!setup.songs.every(isExportedSong)
	) {
		throw new Error("Setup file has an invalid shape.");
	}
	const scoring = parseSetupScoring(setup.scoring);

	return {
		version: 1,
		exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : new Date().toISOString(),
		source: {
			code:
				typeof (data.source as Record<string, unknown> | undefined)?.code === "string"
					? ((data.source as Record<string, unknown>).code as string)
					: "",
		},
		setup: {
			theme: setup.theme,
			detailQuestion: setup.detailQuestion,
			hardcoreRequired: setup.hardcoreRequired,
			scoring,
			songs: setup.songs,
		},
	};
};

export const buildAdminSetupExport = (room: Room): AdminSetupExportV1 => ({
	version: 1,
	exportedAt: new Date().toISOString(),
	source: { code: room.code },
	setup: {
		theme: room.theme ?? "",
		detailQuestion: room.detailQuestion ?? "",
		hardcoreRequired: !!room.hardcoreRequired,
		scoring: {
			guessPoints: room.scoring.guessPoints,
			detailGuessPoints: room.scoring.detailGuessPoints,
			themeGuessPoints: room.scoring.themeGuessPoints,
			hardcoreMultiplier: room.scoring.hardcoreMultiplier,
			hardcoreRules: room.scoring.hardcoreRules,
			themeRules: room.scoring.themeRules,
			tieBreaker: room.scoring.tieBreaker,
		},
		songs: room.songs.map((song) => ({
			url: song.url,
			submitter: song.submitter,
			title: song.title ?? "",
			detailAnswer: song.detailAnswer ?? "",
		})),
	},
});

export const getAdminSetupFilename = (roomCode: string) =>
	`guess-the-song-setup-${roomCode.toLowerCase()}.json`;

export const roomHasAdminSetupContent = (room: Room) =>
	room.songs.length > 0 ||
	(room.theme ?? "").trim().length > 0 ||
	(room.detailQuestion ?? "").trim().length > 0 ||
	!!room.hardcoreRequired;
