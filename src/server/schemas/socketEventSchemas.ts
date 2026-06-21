import { z } from "zod";
import {
	parseAvatarConfig,
	parseBool,
	parseIntSafe,
	parseName,
	parseOptionalText,
	parseOptionalUrl,
	parseRequiredUrl,
	parseRoomCode,
} from "./inputParsers";

const roomCodeSchema = z.preprocess(
	(value) => parseRoomCode(value),
	z.string().min(1, { message: "Invalid room code" })
);

const songIdSchema = z.preprocess(
	(value) => parseIntSafe(value),
	z.number().int().nonnegative({ message: "Invalid song ID" })
);
const playerNameSchema = z.preprocess((value) => parseName(value, "Player"), z.string());
const orderSchema = z.array(z.string());
const boolSchema = (fallback = false) =>
	z.preprocess((value) => parseBool(value, fallback), z.boolean());

const optionalRoomCodeSchema = z.preprocess(
	(value) => {
		if (value == null || value === "") return undefined;
		return parseRoomCode(value) ?? undefined;
	},
	z.string().min(1).optional()
);

const avatarConfigSchema = z.object({
	base: z.string(),
	hair: z.string(),
	eyes: z.string(),
	mouth: z.string(),
	headwear: z.string(),
});

const avatarSchema = z.preprocess(
	(value) => parseAvatarConfig(value) ?? undefined,
	avatarConfigSchema.optional()
);

export const createRoomPayloadSchema = z
	.object({
		theme: z.unknown().optional(),
		backgroundUrl: z.unknown().optional(),
		hostName: z.unknown().optional(),
		avatar: z.unknown().optional(),
	})
	.transform((input) => ({
		theme: parseOptionalText(input.theme) ?? "",
		backgroundUrl: parseOptionalUrl(input.backgroundUrl),
		hostName: parseName(input.hostName, "Host"),
		avatar: parseAvatarConfig(input.avatar) ?? undefined,
	}));

export const joinRoomPayloadSchema = z
	.object({
		code: roomCodeSchema,
		name: z.preprocess((value) => parseName(value, "Player"), z.string()),
		hardcore: z.preprocess((value) => parseBool(value, false), z.boolean()),
		clientId: z.preprocess((value) => parseOptionalText(value), z.string().optional()),
		hostToken: z.preprocess((value) => parseOptionalText(value), z.string().optional()),
		avatar: avatarSchema.optional(),
	})
	.transform((input) => ({
		code: input.code,
		name: input.name,
		hardcore: input.hardcore,
		clientId: input.clientId,
		hostToken: input.hostToken,
		avatar: input.avatar,
	}));

export const joinAdminRoomPayloadSchema = z.object({
	code: roomCodeSchema,
	adminToken: z.preprocess((value) => parseOptionalText(value) ?? "", z.string().min(1)),
	clientId: z.preprocess((value) => parseOptionalText(value) ?? "", z.string().min(1)),
});

export const addSongPayloadSchema = z
	.object({
		code: roomCodeSchema,
		url: z.preprocess(
			(value) => parseRequiredUrl(value),
			z.string().min(1, { message: "Invalid URL" })
		),
		submitter: z.preprocess((value) => parseName(value, "Player"), z.string()),
		title: z.preprocess((value) => parseOptionalText(value) ?? "", z.string()),
		detailAnswer: z.preprocess((value) => parseOptionalText(value), z.string().nullable()),
	})
	.transform((input) => ({
		code: input.code,
		url: input.url,
		submitter: input.submitter,
		title: input.title,
		detailAnswer: input.detailAnswer,
	}));

export const updateSongPayloadSchema = z
	.object({
		songId: songIdSchema,
		code: roomCodeSchema,
		url: z.preprocess(
			(value) => parseRequiredUrl(value),
			z.string().min(1, { message: "Invalid URL" })
		),
		submitter: z.preprocess((value) => parseName(value, "Player"), z.string()),
		title: z.preprocess((value) => parseOptionalText(value) ?? "", z.string()),
		detailAnswer: z.preprocess((value) => parseOptionalText(value), z.string().nullable()),
	})
	.transform((input) => ({
		songId: input.songId,
		code: input.code,
		url: input.url,
		submitter: input.submitter,
		title: input.title,
		detailAnswer: input.detailAnswer,
	}));

export const startGamePayloadSchema = z.object({
	code: roomCodeSchema,
});

export const playSongPayloadSchema = z.object({
	code: roomCodeSchema,
	songId: songIdSchema,
});

export const removeSongPayloadSchema = z.object({
	code: roomCodeSchema,
	songId: songIdSchema,
});

export const nextSongPayloadSchema = z.object({
	code: roomCodeSchema,
});

export const beginRecapPayloadSchema = z.object({
	code: roomCodeSchema,
});

export const showResultsPayloadSchema = z.object({
	code: roomCodeSchema,
});

export const finalizeResultsPayloadSchema = z.object({
	code: roomCodeSchema,
});

export const getSongGuessStatsPayloadSchema = z.object({
	code: roomCodeSchema,
});

export const selectOrderPayloadSchema = z.object({
	code: roomCodeSchema,
	songId: songIdSchema,
	playerName: playerNameSchema,
	order: orderSchema,
});

export const selectDetailOrderPayloadSchema = z.object({
	code: roomCodeSchema,
	songId: songIdSchema,
	playerName: playerNameSchema,
	order: orderSchema,
});

export const submitAllOrdersPayloadSchema = z.object({
	code: roomCodeSchema,
	playerName: playerNameSchema,
	guesses: z.record(z.string().regex(/^\d+$/), orderSchema),
});

export const lockAnswerPayloadSchema = z.object({
	code: roomCodeSchema,
	songId: songIdSchema,
	playerName: playerNameSchema,
});

export const lockDetailPayloadSchema = z.object({
	code: roomCodeSchema,
	songId: songIdSchema,
	playerName: playerNameSchema,
});

export const themeEditPayloadSchema = z.object({
	code: roomCodeSchema,
	theme: z.preprocess((value) => parseOptionalText(value) ?? "", z.string()),
});

export const detailQuestionPayloadSchema = z.object({
	code: roomCodeSchema,
	question: z.preprocess((value) => parseOptionalText(value), z.string().nullable()),
});

export const themeGuessPayloadSchema = z.object({
	code: roomCodeSchema,
	playerName: playerNameSchema,
	guess: z.preprocess((value) => parseOptionalText(value) ?? "", z.string()),
});

export const themeRevealPayloadSchema = z.object({
	code: roomCodeSchema,
});

export const hardcoreRequiredPayloadSchema = z.object({
	code: roomCodeSchema,
	required: boolSchema(false),
});

export const scoreRulesPayloadSchema = z.object({
	code: roomCodeSchema,
	guessPoints: z.preprocess((value) => parseIntSafe(value), z.number().int().min(0).max(100)),
	detailGuessPoints: z.preprocess((value) => parseIntSafe(value), z.number().int().min(0).max(100)),
	themeGuessPoints: z.preprocess((value) => parseIntSafe(value), z.number().int().min(0).max(100)),
	hardcoreMultiplier: z.preprocess((value) => {
		if (value == null || value === "") return undefined;
		if (typeof value === "number") return value;
		if (typeof value === "string") {
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : value;
		}
		return value;
	}, z.number().min(1).max(10)),
});

export const playerHardcorePayloadSchema = z.object({
	code: roomCodeSchema,
	hardcore: boolSchema(false),
});

export const playerReadyPayloadSchema = z.object({
	code: roomCodeSchema,
	ready: boolSchema(false),
});

export const revealedSongsPayloadSchema = z.object({
	code: roomCodeSchema,
	revealed: z.preprocess((value) => {
		if (!Array.isArray(value)) return [];
		return value
			.map((item) => parseIntSafe(item))
			.filter((item): item is number => item != null);
	}, z.array(z.number().int())),
});

export const revealSubmitterPayloadSchema = z.object({
	code: roomCodeSchema,
	songId: songIdSchema,
});

export const revealSubmitterAllPayloadSchema = z.object({
	code: roomCodeSchema,
});

export const devSeedPayloadSchema = z.object({
	code: roomCodeSchema,
	players: z.preprocess((value) => parseIntSafe(value), z.number().int().optional()),
	songs: z.preprocess((value) => parseIntSafe(value), z.number().int().optional()),
	ready: z.preprocess((value) => parseBool(value, true), z.boolean().optional()),
});

export const devResyncPayloadSchema = z.object({
	code: optionalRoomCodeSchema,
});

export const debugSnapshotPayloadSchema = z.object({
	code: optionalRoomCodeSchema,
});

export const kickPlayerPayloadSchema = z.object({
	code: roomCodeSchema,
	playerName: playerNameSchema,
});

export const adminGetDashboardPayloadSchema = z.object({
	code: roomCodeSchema,
});
