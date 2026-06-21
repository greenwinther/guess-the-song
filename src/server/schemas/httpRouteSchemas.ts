import { z } from "zod";
import { parseName, parseOptionalText, parseRoomCode } from "./inputParsers";

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const optionalTrimmedTextSchema = z.preprocess((value) => {
	const v = firstValue(value);
	return parseOptionalText(v) ?? undefined;
}, z.string().optional());

export const youtubeSearchQuerySchema = z.object({
	q: optionalTrimmedTextSchema.optional(),
});

export const youtubeTitleQuerySchema = z.object({
	id: optionalTrimmedTextSchema.optional(),
});

export const youtubePlaylistQuerySchema = z.object({
	url: optionalTrimmedTextSchema.optional(),
	limit: z.preprocess(
		(value) => {
			const first = firstValue(value);
			return first == null || first === "" ? undefined : first;
		},
		z.coerce.number().int().min(1).max(25).optional(),
	),
});

export const roomCodeParamsSchema = z.object({
	code: z.preprocess((value) => parseRoomCode(firstValue(value)), z.string().min(1)),
});

export const createRoomBodySchema = z
	.object({
		theme: z.unknown().optional(),
		backgroundUrl: z.unknown().optional(),
		hostName: z.unknown().optional(),
	})
	.transform((input) => ({
		theme: parseOptionalText(input.theme) ?? "",
		backgroundUrl: parseOptionalText(input.backgroundUrl),
		hostName: parseName(input.hostName, "Host"),
	}));

