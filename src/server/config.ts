import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const optionalUrlSchema = z.preprocess((value) => {
	if (value == null) return undefined;
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}, z.string().url().optional());

const optionalTextSchema = z.preprocess((value) => {
	if (value == null) return undefined;
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
	SOCKET_PORT: z.preprocess(
		(value) => (value == null || value === "" ? 4000 : value),
		z.coerce.number().int().min(1).max(65535)
	),
	CLIENT_URL: optionalUrlSchema,
	CLIENT_URL_2: optionalUrlSchema,
	YOUTUBE_API_KEY: optionalTextSchema,
	CLEANUP_INTERVAL_MS: z.preprocess(
		(value) => (value == null || value === "" ? 60_000 : value),
		z.coerce.number().int().min(1)
	),
	LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	const details = parsed.error.issues
		.map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
		.join("; ");
	throw new Error(`Invalid server environment configuration: ${details}`);
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === "production";
const clientUrl = raw.CLIENT_URL ?? (isProduction ? undefined : "http://localhost:3000");

if (isProduction && !clientUrl) {
	throw new Error("Missing CLIENT_URL in production");
}

if (isProduction && !raw.YOUTUBE_API_KEY) {
	throw new Error("Missing YOUTUBE_API_KEY in production");
}

export const serverConfig = {
	nodeEnv: raw.NODE_ENV,
	isProduction,
	socketPort: raw.SOCKET_PORT,
	cleanupIntervalMs: raw.CLEANUP_INTERVAL_MS,
	clientUrl: clientUrl ?? "http://localhost:3000",
	clientUrl2: raw.CLIENT_URL_2 ?? null,
	allowedOrigins: [clientUrl, raw.CLIENT_URL_2].filter((v): v is string => Boolean(v)),
	youtubeApiKey: raw.YOUTUBE_API_KEY ?? null,
	logLevel: raw.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
} as const;

export type ServerConfig = typeof serverConfig;
