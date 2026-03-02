// src/app/api/rooms/[code]/route.ts
// Legacy/fallback HTTP endpoint (currently unused by the app).
import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/lib/rooms";
import { toPublicRoom } from "@/server/state/publicRoom";
import { parseRoomCode } from "@/server/validation";

export async function GET(req: NextRequest) {
	// manually extract the last segment of the path as "code"
	const url = new URL(req.url);
	const parts = url.pathname.split("/");
	const code = parseRoomCode(parts[parts.length - 1]);
	if (!code) return NextResponse.json({ error: "Invalid room code" }, { status: 400 });

	try {
		const room = await getRoom(code);
		return NextResponse.json(toPublicRoom(room));
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 404 });
	}
}
