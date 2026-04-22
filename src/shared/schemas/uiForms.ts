import { z } from "zod";
import { getYouTubeID } from "@/lib/youtube";
import { isValidUrl, normalizeRoomCode, trimText } from "@/shared/validation/inputNormalization";

export const joinLobbyFormSchema = z.object({
	name: z.preprocess(
		trimText,
		z.string().min(1, "Enter your name").max(24, "Name must be 24 characters or fewer")
	),
	roomCode: z.preprocess(
		normalizeRoomCode,
		z.string().regex(/^[A-Z0-9]{4}$/, "Enter a valid 4-character room code")
	),
});

export const createLobbyFormSchema = z
	.object({
		theme: z.preprocess(trimText, z.string().max(100, "Theme must be 100 characters or fewer")),
		backgroundUrl: z.preprocess(trimText, z.string()),
	})
	.superRefine((data, ctx) => {
		if (data.backgroundUrl && !isValidUrl(data.backgroundUrl)) {
			ctx.addIssue({
				code: "custom",
				path: ["backgroundUrl"],
				message: "Enter a valid image URL",
			});
		}
	})
	.transform((data) => ({
		theme: data.theme,
		backgroundUrl: data.backgroundUrl || null,
	}));

export const songSubmitFormSchema = z
	.object({
		url: z.preprocess(trimText, z.string().min(1, "Choose a song or paste a YouTube URL")),
		submitter: z.preprocess(
			trimText,
			z.string().min(1, "Enter your name").max(24, "Name must be 24 characters or fewer")
		),
		detailAnswer: z.preprocess(trimText, z.string().max(120, "Answer must be 120 characters or fewer")),
	})
	.superRefine((data, ctx) => {
		if (!isValidUrl(data.url)) {
			ctx.addIssue({
				code: "custom",
				path: ["url"],
				message: "Enter a valid URL",
			});
			return;
		}
		if (!getYouTubeID(data.url)) {
			ctx.addIssue({
				code: "custom",
				path: ["url"],
				message: "Enter a valid YouTube URL",
			});
		}
	})
	.transform((data) => ({
		url: data.url,
		submitter: data.submitter,
		detailAnswer: data.detailAnswer || undefined,
	}));
