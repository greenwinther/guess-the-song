import type { Express, Request, Response } from "express";
import { addSong, createRoom, getRoom } from "@/lib/rooms";
import { toPublicRoom } from "@/server/state/publicRoom";
import {
	addSongBodySchema,
	createRoomBodySchema,
	roomCodeParamsSchema,
	validateWithZod,
	youtubeSearchQuerySchema,
	youtubeTitleQuerySchema,
} from "@/server/schemas";
import type { ZodValidationFailure } from "@/server/schemas";
import { serverConfig } from "@/server/config";

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

	app.post("/api/rooms/:code/songs", async (req: Request, res: Response) => {
		const params = validateWithZod(roomCodeParamsSchema, req.params, { errorMessage: "Invalid room code" });
		if (!params.ok) return jsonValidationError(res, params);
		const body = validateWithZod(addSongBodySchema, req.body, { errorMessage: "Invalid request body" });
		if (!body.ok) return jsonValidationError(res, body);

		try {
			const song = await addSong(params.data.code, {
				url: body.data.url,
				submitter: body.data.submitter,
				title: body.data.title,
				detailAnswer: body.data.detailAnswer,
			});
			return res.json(song);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to add song";
			return jsonError(res, 400, message);
		}
	});
}
