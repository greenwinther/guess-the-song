export const trimText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const normalizeRoomCode = (value: unknown) =>
	String(value ?? "")
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "");

export const isValidUrl = (value: string) => URL.canParse(value);
