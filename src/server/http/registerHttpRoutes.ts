import type { Express, Request, Response } from "express";
import { addSong, createRoom, getRoom } from "@/lib/rooms";
import { toPublicRoom } from "@/server/state/publicRoom";
import { parseName, parseOptionalText, parseRequiredUrl, parseRoomCode } from "@/server/validation";

function jsonError(res: Response, status: number, message: string) {
	return res.status(status).json({ error: message });
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
			const q = parseOptionalText(req.query.q) ?? "";
			if (!q) return res.json({ items: [] });

			const key = process.env.YOUTUBE_API_KEY;
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
			const id = parseOptionalText(req.query.id);
			if (!id) return res.json({ title: "" });

			const key = process.env.YOUTUBE_API_KEY;
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
			const theme = parseOptionalText(req.body?.theme) ?? "";
			const backgroundUrl = parseOptionalText(req.body?.backgroundUrl);
			const hostName = parseName(req.body?.hostName, "Host");
			const room = await createRoom(theme, backgroundUrl, hostName, undefined);
			return res.json({ code: room.code });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to create room";
			return jsonError(res, 500, message);
		}
	});

	app.get("/api/rooms/:code", async (req: Request, res: Response) => {
		const code = parseRoomCode(req.params.code);
		if (!code) return jsonError(res, 400, "Invalid room code");

		try {
			const room = await getRoom(code);
			return res.json(toPublicRoom(room));
		} catch (err) {
			const message = err instanceof Error ? err.message : "Room not found";
			return jsonError(res, 404, message);
		}
	});

	app.post("/api/rooms/:code/songs", async (req: Request, res: Response) => {
		const code = parseRoomCode(req.params.code);
		if (!code) return jsonError(res, 400, "Invalid room code");

		const url = parseRequiredUrl(req.body?.url);
		if (!url) return jsonError(res, 400, "Invalid URL");

		try {
			const submitter = parseName(req.body?.submitter, "Player");
			const title = parseOptionalText(req.body?.title) ?? "";
			const detailAnswer = parseOptionalText(req.body?.detailAnswer);
			const song = await addSong(code, { url, submitter, title, detailAnswer });
			return res.json(song);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to add song";
			return jsonError(res, 400, message);
		}
	});
}
