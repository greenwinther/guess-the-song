// scripts/wipeAll.ts

import { prisma } from "../lib/prisma";

async function main() {
	await prisma.player.deleteMany({});
	await prisma.song.deleteMany({});
	await prisma.room.deleteMany({});
	console.log("✅ Wiped Room, Song, Player");
}

main().finally(() => prisma.$disconnect());
