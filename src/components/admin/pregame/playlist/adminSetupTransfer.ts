import type { Room } from "@/types/room";

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
		!setup.songs.every(isExportedSong)
	) {
		throw new Error("Setup file has an invalid shape.");
	}

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
