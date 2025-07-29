"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
exports.getRoom = getRoom;
exports.addSong = addSong;
exports.removeSong = removeSong;
// src/lib/rooms.ts
const nanoid_1 = require("nanoid");
const prisma_1 = require("./prisma");
async function createRoom(theme, backgroundUrl, hostName) {
    const code = (0, nanoid_1.nanoid)(6).toUpperCase();
    return await prisma_1.prisma.room.create({
        data: {
            code,
            theme,
            backgroundUrl,
            players: {
                create: {
                    name: hostName,
                    isHost: true, // Mark the first player as the host
                },
            },
        },
        include: { players: true },
    });
}
async function joinRoom(code, name) {
    const room = await prisma_1.prisma.room.findUnique({
        where: { code },
        include: { players: true },
    });
    if (!room)
        throw new Error("Room not found");
    // If they’re already in, just return that existing player
    const existing = room.players.find((p) => p.name === name);
    if (existing)
        return existing;
    // Otherwise create a new one and return it
    return await prisma_1.prisma.player.create({
        data: { name, roomId: room.id },
    });
}
// And update getRoom to include players
async function getRoom(code) {
    const room = await prisma_1.prisma.room.findUnique({
        where: { code },
        include: { songs: true, players: true },
    });
    if (!room)
        throw new Error("Room not found");
    return room;
}
async function addSong(code, song) {
    const room = await prisma_1.prisma.room.findUnique({ where: { code } });
    if (!room)
        throw new Error("Room not found");
    return await prisma_1.prisma.song.create({
        data: {
            url: song.url,
            submitter: song.submitter,
            title: song.title,
            roomId: room.id,
        },
    });
}
async function removeSong(code, songId) {
    // Optionally verify the song belongs to the room first…
    await prisma_1.prisma.song.delete({
        where: { id: songId },
    });
    // Return the deleted ID so we can broadcast it
    return songId;
}
