// src/lib/rooms.ts

import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function createRoom(theme: string, backgroundUrl: string | null) {
	const code = nanoid(6).toUpperCase();
	return await prisma.room.create({
		data: { code, theme, backgroundUrl },
	});
}

export async function joinRoom(code: string, name: string) {
	const room = await prisma.room.findUnique({ where: { code } });
	if (!room) throw new Error("Room not found");
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

export async function addSong(code: string, song: { url: string; submitter: string }) {
	const room = await prisma.room.findUnique({ where: { code } });
	if (!room) throw new Error("Room not found");
	return await prisma.song.create({
		data: { url: song.url, submitter: song.submitter, roomId: room.id },
	});
}
