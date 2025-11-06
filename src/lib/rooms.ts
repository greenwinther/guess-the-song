// src/lib/rooms.ts
import { nanoid } from "nanoid";
import { prisma } from "./prisma";

export async function createRoom(theme: string, backgroundUrl: string | null, hostName: string) {
	const code = nanoid(4).toUpperCase();
	return await prisma.room.create({
		data: {
			code,
			theme,
			backgroundUrl,
			players: { create: { name: hostName, isHost: true } },
		},
		include: { players: true },
	});
}

export async function joinRoom(
	code: string,
	name: string,
	hardcore: boolean
): Promise<{ player: any; created: boolean }> {
	const room = await prisma.room.findUnique({
		where: { code },
		include: { players: true },
	});
	if (!room) throw new Error("Room not found");

	const existing = room.players.find((p) => p.name === name);
	if (existing) return { player: existing, created: false };

	const player = await prisma.player.create({
		data: { name, isHost: name === "Host", roomId: room.id, hardcore },
	});
	return { player, created: true };
}

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
		data: { url: song.url, submitter: song.submitter, title: song.title, roomId: room.id },
	});
}

export async function removeSong(code: string, songId: number) {
	await prisma.song.delete({ where: { id: songId } });
	return songId;
}

export async function getHardcorePlayerNames(code: string): Promise<string[]> {
	const room = await prisma.room.findUnique({
		where: { code },
		include: { players: { where: { hardcore: true } } },
	});
	return room?.players.map((p) => p.name) ?? [];
}
