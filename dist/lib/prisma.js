"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// lib/prisma.ts
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient({
    log: process.env.LOG_QUERIES === "1" ? ["query", "warn", "error"] : ["warn", "error"], // optional: helps debug what's slow
});
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
