// src/lib/rooms.ts
import { nanoid } from "nanoid";
import { prisma } from "./prisma";

export async function createRoom(theme: string, backgroundUrl: string | null) {
	const code = nanoid(6).toUpperCase();
	return await prisma.room.create({
		data: { code, theme, backgroundUrl },
	});
}

export async function joinRoom(code: string, name: string) {
	const room = await prisma.room.findUnique({
		where: { code },
		include: { players: true },
	});
	if (!room) throw new Error("Room not found");

	// If they’re already in, just return that existing player
	const existing = room.players.find((p) => p.name === name);
	if (existing) return existing;

	// Otherwise create a new one and return it
	return await prisma.player.create({
		data: { name, roomId: room.id },
	});
}

// And update getRoom to include players
export async function getRoom(code: string) {
	const room = await prisma.room.findUnique({
		where: { code },
		include: { songs: true, players: true },
	});
	if (!room) throw new Error("Room not found");
	return room;
}

export async function addSong(code: string, song: { url: string; submitter: string; title: string }) {
	const room = await prisma.room.findUnique({ where: { code } });
	if (!room) throw new Error("Room not found");

	return await prisma.song.create({
		data: {
			url: song.url,
			submitter: song.submitter,
			title: song.title,
			roomId: room.id,
		},
	});
}

export async function removeSong(code: string, songId: number) {
	// Optionally verify the song belongs to the room first…
	await prisma.song.delete({
		where: { id: songId },
	});

	// Return the deleted ID so we can broadcast it
	return songId;
}
