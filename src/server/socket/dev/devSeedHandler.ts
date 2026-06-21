import type { Server, Socket } from "socket.io";
import type {
	ClientToServerEvents,
	DevSeedPayload,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "@/types/socket";
import { requireHostOrAdmin, requireRoom } from "@/server/logic/guards";
import { addSong, getRoom, joinRoomWithIdentity } from "@/lib/rooms";
import { setDetailQuestion, setPlayerReady } from "@/server/store/roomStore";
import { toPublicRoom } from "@/server/state/publicRoom";
import type { AvatarConfig } from "@/types/avatar";
import { devSeedPayloadSchema, validateWithZod } from "@/server/schemas";
import { serverConfig } from "@/server/config";
import { registerDevSeededRoom, seedDevGuessesForRoom } from "./devSeedScoring";

const demoUrls = [
	{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Never Gonna Give You Up" },
	{ url: "https://www.youtube.com/watch?v=3JZ4pnNtyxQ", title: "Take On Me" },
	{ url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ", title: "Bohemian Rhapsody" },
	{ url: "https://www.youtube.com/watch?v=ktvTqknDobU", title: "Radioactive" },
	{ url: "https://www.youtube.com/watch?v=Zi_XLOBDo_Y", title: "Billie Jean" },
	{ url: "https://www.youtube.com/watch?v=09R8_2nJtjg", title: "Sugar" },
	{ url: "https://www.youtube.com/watch?v=y6120QOlsfU", title: "Sandstorm" },
	{ url: "https://www.youtube.com/watch?v=60ItHLz5WEA", title: "Faded" },
	{ url: "https://www.youtube.com/watch?v=hT_nvWreIhg", title: "Counting Stars" },
	{ url: "https://www.youtube.com/watch?v=lp-EO5I60KA", title: "Thinking Out Loud" },
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
	const key = serverConfig.youtubeApiKey;
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
		if (serverConfig.isProduction) return cb?.(false);

		const payload = validateWithZod(devSeedPayloadSchema, data, {
			errorMessage: "Invalid DEV_SEED payload",
		});
		if (!payload.ok) return cb?.(false);
		const { code } = payload.data;

		const room = requireRoom(socket, () => cb?.(false));
		if (!room || room.code !== code) return;
		if (!requireHostOrAdmin(socket, room, () => cb?.(false))) return;

		const players = payload.data.players ?? 10;
		const songs = payload.data.songs ?? 10;
		const ready = payload.data.ready ?? true;
		const ensureQuestion = !room.detailQuestion;
		if (ensureQuestion) {
			setDetailQuestion(code, "Which year was this song made?");
		}

		for (let i = 0; i < players; i++) {
			const name = `Player${i + 1}`;
			const { created } = await joinRoomWithIdentity(
				code,
				name,
				false,
				`dev-seed-${code}-${name}`,
				undefined,
				makeAvatar(i)
			);
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

		registerDevSeededRoom(code);
		const updated = await getRoom(code);
		if (updated.phase !== "LOBBY") seedDevGuessesForRoom(updated);
		io.to(code).emit("roomData", toPublicRoom(updated));
		cb?.(true);
	});
};
