import type { AvatarConfig } from "@/types/avatar";
import { isValidUrl, normalizeRoomCode, trimText } from "@/shared/validation/inputNormalization";

const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function parseRoomCode(input: unknown): string | null {
	const code = normalizeRoomCode(input);
	return code ? code : null;
}

export function parseName(input: unknown, fallback: string): string {
	const s = trimText(input);
	return s || fallback;
}

export function parseOptionalUrl(input: unknown): string | null {
	if (input == null) return null;
	const s = trimText(input);
	if (!s) return null;
	if (!isValidUrl(s)) {
		return null;
	}
	return s;
}

export function parseRequiredUrl(input: unknown): string | null {
	const v = parseOptionalUrl(input);
	return v ?? null;
}

export function parseOptionalText(input: unknown): string | null {
	if (!isString(input)) return null;
	const s = trimText(input);
	return s ? s : null;
}

export function parseIntSafe(input: unknown): number | null {
	if (isNumber(input)) return Math.trunc(input);
	if (isString(input)) {
		const n = Number.parseInt(input, 10);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

export function parseBool(input: unknown, fallback = false): boolean {
	if (typeof input === "boolean") return input;
	return fallback;
}

export function parseAvatarConfig(input: unknown): AvatarConfig | null {
	if (!input || typeof input !== "object") return null;
	const obj = input as Record<string, unknown>;
	const base = isString(obj.base) ? obj.base : null;
	if (!base) return null;
	return {
		base,
		hair: isString(obj.hair) ? obj.hair : "empty",
		eyes: isString(obj.eyes) ? obj.eyes : "empty",
		mouth: isString(obj.mouth) ? obj.mouth : "empty",
		headwear: isString(obj.headwear) ? obj.headwear : "empty",
	};
}
