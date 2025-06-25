// src/lib/rooms.ts
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
const prisma = new PrismaClient();
export async function createRoom(theme, backgroundUrl) {
    const code = nanoid(6).toUpperCase();
    return await prisma.room.create({
        data: { code, theme, backgroundUrl },
    });
}
export async function joinRoom(code, name) {
    const room = await prisma.room.findUnique({
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
    return await prisma.player.create({
        data: { name, roomId: room.id },
    });
}
// And update getRoom to include players
export async function getRoom(code) {
    const room = await prisma.room.findUnique({
        where: { code },
        include: { songs: true, players: true },
    });
    if (!room)
        throw new Error("Room not found");
    return room;
}
export async function addSong(code, song) {
    const room = await prisma.room.findUnique({ where: { code } });
    if (!room)
        throw new Error("Room not found");
    return await prisma.song.create({
        data: {
            url: song.url,
            submitter: song.submitter,
            title: song.title,
            roomId: room.id,
        },
    });
}
export async function removeSong(code, songId) {
    // Optionally verify the song belongs to the room first…
    await prisma.song.delete({
        where: { id: songId },
    });
    // Return the deleted ID so we can broadcast it
    return songId;
}
