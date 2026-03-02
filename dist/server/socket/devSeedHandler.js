"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devSeedHandler = void 0;
const validation_1 = require("../validation");
const guards_1 = require("../logic/guards");
const rooms_1 = require("@/lib/rooms");
const roomStore_1 = require("../store/roomStore");
const publicRoom_1 = require("../state/publicRoom");
const demoUrls = [
    { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Never Gonna Give You Up" },
    { url: "https://www.youtube.com/watch?v=3JZ4pnNtyxQ", title: "Take On Me" },
    { url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ", title: "Bohemian Rhapsody" },
    { url: "https://www.youtube.com/watch?v=ktvTqknDobU", title: "Radioactive" },
    { url: "https://www.youtube.com/watch?v=Zi_XLOBDo_Y", title: "Billie Jean" },
    { url: "https://www.youtube.com/watch?v=09R8_2nJtjg", title: "Sugar" },
];
const pad2 = (value) => String(value).padStart(2, "0");
const makeAvatar = (index) => ({
    base: `base-${pad2((index % 16) + 1)}`,
    eyes: `eyes-${pad2((index % 20) + 1)}`,
    mouth: `mouth-${pad2((index % 6) + 1)}`,
    hair: `hair-${pad2((index % 15) + 1)}`,
    headwear: `headwear-${pad2((index % 12) + 1)}`,
});
async function fetchPopularMusic(count) {
    var _a;
    const key = process.env.YOUTUBE_API_KEY;
    if (!key)
        return null;
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("chart", "mostPopular");
    url.searchParams.set("videoCategoryId", "10");
    url.searchParams.set("maxResults", String(Math.min(count, 50)));
    url.searchParams.set("key", key);
    const res = await fetch(url.toString());
    if (!res.ok)
        return null;
    const json = (await res.json());
    const items = (_a = json.items) !== null && _a !== void 0 ? _a : [];
    return items
        .map((item) => {
        var _a, _b;
        return ({
            url: `https://www.youtube.com/watch?v=${item.id}`,
            title: (_b = (_a = item.snippet) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : "YouTube Track",
        });
    })
        .filter((x) => x.url);
}
const devSeedHandler = (io, socket) => {
    socket.on("DEV_SEED", async (data, cb) => {
        var _a, _b, _c;
        if (process.env.NODE_ENV === "production")
            return cb === null || cb === void 0 ? void 0 : cb(false);
        const code = (0, validation_1.parseRoomCode)(data.code);
        if (!code)
            return cb === null || cb === void 0 ? void 0 : cb(false);
        const room = (0, guards_1.requireRoom)(socket, () => cb === null || cb === void 0 ? void 0 : cb(false));
        if (!room || room.code !== code)
            return;
        if (!(0, guards_1.requireHost)(socket, room, () => cb === null || cb === void 0 ? void 0 : cb(false)))
            return;
        const players = (_a = (0, validation_1.parseIntSafe)(data.players)) !== null && _a !== void 0 ? _a : 3;
        const songs = (_b = (0, validation_1.parseIntSafe)(data.songs)) !== null && _b !== void 0 ? _b : 5;
        const ready = (0, validation_1.parseBool)(data.ready, true);
        const ensureQuestion = !room.detailQuestion;
        if (ensureQuestion) {
            (0, roomStore_1.setDetailQuestion)(code, "Which year was this song made?");
        }
        for (let i = 0; i < players; i++) {
            const name = `Player${i + 1}`;
            const { created } = await (0, rooms_1.joinRoom)(code, name, false, makeAvatar(i));
            if (created && ready)
                (0, roomStore_1.setPlayerReady)(code, name, true);
        }
        const yt = await fetchPopularMusic(songs);
        const list = yt && yt.length > 0 ? yt : demoUrls;
        for (let i = 0; i < songs; i++) {
            const pick = list[i % list.length];
            const submitter = `Player${(i % Math.max(players, 1)) + 1}`;
            const title = (_c = pick.title) !== null && _c !== void 0 ? _c : `Demo Song ${i + 1}`;
            const detailAnswer = room.detailQuestion ? String(1980 + (i % 30)) : undefined;
            await (0, rooms_1.addSong)(code, { url: pick.url, submitter, title, detailAnswer });
        }
        const updated = await (0, rooms_1.getRoom)(code);
        io.to(code).emit("roomData", (0, publicRoom_1.toPublicRoom)(updated));
        cb === null || cb === void 0 ? void 0 : cb(true);
    });
};
exports.devSeedHandler = devSeedHandler;
