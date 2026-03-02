// src/server/socket/devSeedHandler.ts
import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	DevSeedPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { parseBool, parseIntSafe, parseRoomCode } from "../validation";
import { requireHost, requireRoom } from "../logic/guards";
import { addSong, getRoom, joinRoom } from "@/lib/rooms";
import { setDetailQuestion, setPlayerReady } from "../store/roomStore";
import { toPublicRoom } from "../state/publicRoom";
import type { AvatarConfig } from "@/types/avatar";

const demoUrls = [
	{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Never Gonna Give You Up" },
	{ url: "https://www.youtube.com/watch?v=3JZ4pnNtyxQ", title: "Take On Me" },
	{ url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ", title: "Bohemian Rhapsody" },
	{ url: "https://www.youtube.com/watch?v=ktvTqknDobU", title: "Radioactive" },
	{ url: "https://www.youtube.com/watch?v=Zi_XLOBDo_Y", title: "Billie Jean" },
	{ url: "https://www.youtube.com/watch?v=09R8_2nJtjg", title: "Sugar" },
];

const pad2 = (value: number) => String(value).padStart(2, "0");
const makeAvatar = (index: number): AvatarConfig => ({
	base: `base-${pad2((index % 16) + 1)}`,
	eyes: `eyes-${pad2((index % 20) + 1)}`,
	mouth: `mouth-${pad2((index % 6) + 1)}`,
	hair: `hair-${pad2((index % 15) + 1)}`,
	headwear: `headwear-${pad2((index % 12) + 1)}`,
});

async function fetchPopularMusic(count: number) {
	const key = process.env.YOUTUBE_API_KEY;
	if (!key) return null;
	const url = new URL("https://www.googleapis.com/youtube/v3/videos");
	url.searchParams.set("part", "snippet");
	url.searchParams.set("chart", "mostPopular");
	url.searchParams.set("videoCategoryId", "10");
	url.searchParams.set("maxResults", String(Math.min(count, 50)));
	url.searchParams.set("key", key);

	const res = await fetch(url.toString());
	if (!res.ok) return null;
	const json = (await res.json()) as {
		items?: Array<{ id: string; snippet?: { title?: string } }>;
	};
	const items = json.items ?? [];
	return items
		.map((item) => ({
			url: `https://www.youtube.com/watch?v=${item.id}`,
			title: item.snippet?.title ?? "YouTube Track",
		}))
		.filter((x) => x.url);
}

export const devSeedHandler = (
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
	socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
	socket.on("DEV_SEED", async (data: DevSeedPayload, cb?: (ok: boolean) => void) => {
		if (process.env.NODE_ENV === "production") return cb?.(false);

		const code = parseRoomCode(data.code);
		if (!code) return cb?.(false);

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return;
		if (!requireHost(socket, room, () => cb?.(false))) return;

		const players = parseIntSafe(data.players) ?? 3;
		const songs = parseIntSafe(data.songs) ?? 5;
		const ready = parseBool(data.ready, true);
		const ensureQuestion = !room.detailQuestion;
		if (ensureQuestion) {
			setDetailQuestion(code, "Which year was this song made?");
		}

		for (let i = 0; i < players; i++) {
			const name = `Player${i + 1}`;
			const { created } = await joinRoom(code, name, false, makeAvatar(i));
			if (created && ready) setPlayerReady(code, name, true);
		}

		const yt = await fetchPopularMusic(songs);
		const list = yt && yt.length > 0 ? yt : demoUrls;
		for (let i = 0; i < songs; i++) {
			const pick = list[i % list.length];
			const submitter = `Player${(i % Math.max(players, 1)) + 1}`;
			const title = pick.title ?? `Demo Song ${i + 1}`;
			const detailAnswer = room.detailQuestion ? String(1980 + (i % 30)) : undefined;
			await addSong(code, { url: pick.url, submitter, title, detailAnswer });
		}

		const updated = await getRoom(code);
		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
