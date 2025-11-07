// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: process.env.LOG_QUERIES === "1" ? ["query", "warn", "error"] : ["warn", "error"], // optional: helps debug what's slow
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
