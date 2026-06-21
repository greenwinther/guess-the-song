import type { Express, Request, Response } from "express";
import { createRoom, getRoom } from "@/lib/rooms";
import { toPublicRoom } from "@/server/state/publicRoom";
import {
	createRoomBodySchema,
	roomCodeParamsSchema,
	validateWithZod,
	youtubePlaylistQuerySchema,
	youtubeSearchQuerySchema,
	youtubeTitleQuerySchema,
} from "@/server/schemas";
import type { ZodValidationFailure } from "@/server/schemas";
import { serverConfig } from "@/server/config";
import { getYouTubePlaylistID } from "@/lib/youtube";

const PLAYLIST_IMPORT_LIMIT = 25;

function jsonError(res: Response, status: number, message: string) {
	return res.status(status).json({ error: message });
}

function jsonValidationError(
	res: Response,
	result: ZodValidationFailure
) {
	return res.status(400).json({ error: result.error, issues: result.issues });
}

export function registerHttpRoutes(app: Express) {
	app.get("/", (_req, res) => {
		res.status(200).type("text/plain").send("Socket server is running");
	});

	app.get("/health", (_req, res) => {
		res.status(200).json({ ok: true, service: "socket-express" });
	});

	app.get("/api/youtube-search", async (req, res) => {
		try {
			const query = validateWithZod(youtubeSearchQuerySchema, req.query);
			if (!query.ok) return jsonValidationError(res, query);
			const q = query.data.q ?? "";
			if (!q) return res.json({ items: [] });

			const key = serverConfig.youtubeApiKey;
			if (!key) return jsonError(res, 500, "Missing YOUTUBE_API_KEY");

			const url = new URL("https://www.googleapis.com/youtube/v3/search");
			url.searchParams.set("part", "snippet");
			url.searchParams.set("type", "video");
			url.searchParams.set("maxResults", "5");
			url.searchParams.set("q", q);
			url.searchParams.set("key", key);

			const upstream = await fetch(url.toString());
			if (!upstream.ok) {
				return jsonError(res, 502, `YouTube search failed (${upstream.status})`);
			}

			const body = await upstream.json();
			return res.json(body);
		} catch {
			return jsonError(res, 500, "Failed to search YouTube");
		}
	});

	app.get("/api/youtube-title", async (req, res) => {
		try {
			const query = validateWithZod(youtubeTitleQuerySchema, req.query);
			if (!query.ok) return jsonValidationError(res, query);
			const id = query.data.id;
			if (!id) return res.json({ title: "" });

			const key = serverConfig.youtubeApiKey;
			if (!key) return jsonError(res, 500, "Missing YOUTUBE_API_KEY");

			const url = new URL("https://www.googleapis.com/youtube/v3/videos");
			url.searchParams.set("part", "snippet");
			url.searchParams.set("id", id);
			url.searchParams.set("key", key);

			const upstream = await fetch(url.toString());
			if (!upstream.ok) {
				return jsonError(res, 502, `YouTube title lookup failed (${upstream.status})`);
			}

			const body = (await upstream.json()) as {
				items?: Array<{ snippet?: { title?: string } }>;
			};
			return res.json({ title: body.items?.[0]?.snippet?.title ?? "" });
		} catch {
			return jsonError(res, 500, "Failed to resolve YouTube title");
		}
	});

	app.get("/api/youtube-playlist", async (req, res) => {
		try {
			const query = validateWithZod(youtubePlaylistQuerySchema, req.query);
			if (!query.ok) return jsonValidationError(res, query);

			const rawUrl = query.data.url ?? "";
			const playlistId = getYouTubePlaylistID(rawUrl);
			if (!playlistId) {
				return jsonError(res, 400, "Enter a valid YouTube playlist URL.");
			}

			const key = serverConfig.youtubeApiKey;
			if (!key) return jsonError(res, 500, "Missing YOUTUBE_API_KEY");

			const limit = Math.min(query.data.limit ?? PLAYLIST_IMPORT_LIMIT, PLAYLIST_IMPORT_LIMIT);
			const items: Array<{ videoId: string; title: string; url: string }> = [];
			const seenVideoIds = new Set<string>();
			let nextPageToken: string | undefined;
			let truncated = false;

			do {
				const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
				url.searchParams.set("part", "snippet,contentDetails");
				url.searchParams.set("playlistId", playlistId);
				url.searchParams.set("maxResults", String(Math.min(50, limit - items.length)));
				url.searchParams.set("key", key);
				if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

				const upstream = await fetch(url.toString());
				if (!upstream.ok) {
					if (upstream.status === 403 || upstream.status === 404) {
						return jsonError(res, 400, "Playlist not found or it is private.");
					}
					return jsonError(res, 502, `YouTube playlist lookup failed (${upstream.status})`);
				}

				const body = (await upstream.json()) as {
					nextPageToken?: string;
					items?: Array<{
						snippet?: { title?: string };
						contentDetails?: { videoId?: string };
					}>;
				};

				for (const item of body.items ?? []) {
					const videoId = item.contentDetails?.videoId?.trim();
					const title = item.snippet?.title?.trim();
					if (!videoId || !title || title === "Private video" || title === "Deleted video") {
						continue;
					}
					if (seenVideoIds.has(videoId)) continue;
					seenVideoIds.add(videoId);
					items.push({
						videoId,
						title,
						url: `https://www.youtube.com/watch?v=${videoId}`,
					});
					if (items.length >= limit) break;
				}

				nextPageToken = body.nextPageToken;
				truncated = Boolean(nextPageToken) && items.length >= limit;
			} while (nextPageToken && items.length < limit);

			return res.json({
				items,
				limit,
				truncated,
			});
		} catch {
			return jsonError(res, 500, "Failed to import YouTube playlist");
		}
	});

	app.post("/api/rooms", async (req: Request, res: Response) => {
		try {
			const body = validateWithZod(createRoomBodySchema, req.body, { errorMessage: "Invalid request body" });
			if (!body.ok) return jsonValidationError(res, body);
			const room = await createRoom(body.data.theme, body.data.backgroundUrl, body.data.hostName, undefined);
			return res.json({ code: room.code });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create room";
			return jsonError(res, 500, message);
		}
	});

	app.get("/api/rooms/:code", async (req: Request, res: Response) => {
		const params = validateWithZod(roomCodeParamsSchema, req.params, { errorMessage: "Invalid room code" });
		if (!params.ok) return jsonValidationError(res, params);
		const code = params.data.code;

		try {
			const room = await getRoom(code);
			return res.json(toPublicRoom(room));
		} catch (err) {
			const message = err instanceof Error ? err.message : "Room not found";
			return jsonError(res, 404, message);
		}
	});

}
