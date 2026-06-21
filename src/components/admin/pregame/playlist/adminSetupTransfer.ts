import type { Room, RoomScoring } from "@/types/room";

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
		typeof (setup.scoring as Record<string, unknown> | undefined)?.guessPoints !== "number" ||
		typeof (setup.scoring as Record<string, unknown> | undefined)?.detailGuessPoints !== "number" ||
		typeof (setup.scoring as Record<string, unknown> | undefined)?.themeGuessPoints !== "number" ||
		typeof (setup.scoring as Record<string, unknown> | undefined)?.hardcoreMultiplier !== "number" ||
		!setup.songs.every(isExportedSong)
	) {
		throw new Error("Setup file has an invalid shape.");
	}
	const scoring = setup.scoring as Partial<RoomScoring>;
	const hardcoreRules = scoring.hardcoreRules ?? {
		enabled: true,
		rewardMode: "multiplier" as const,
		startBonusPoints: 1,
		multiplier: scoring.hardcoreMultiplier ?? 1.5,
	};
	const themeRules = scoring.themeRules ?? {
		guessesPerSong: 1,
		correctThemePoints: scoring.themeGuessPoints ?? 1,
		firstCorrectThemeBonusEnabled: false,
		firstCorrectThemePoints: 2,
	};

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
			scoring: {
				guessPoints: scoring.guessPoints ?? 1,
				detailGuessPoints: scoring.detailGuessPoints ?? 1,
				themeGuessPoints: themeRules.correctThemePoints,
				hardcoreMultiplier: hardcoreRules.multiplier,
				hardcoreRules,
				themeRules,
				tieBreaker: scoring.tieBreaker ?? "none",
			},
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
