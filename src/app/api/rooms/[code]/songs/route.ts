// src/app/api/rooms/[code]/songs/route.ts
// Legacy/fallback HTTP endpoint (currently unused by the app).
import { NextResponse } from "next/server";
import { addSong } from "@/lib/rooms";
import { parseName, parseOptionalText, parseRequiredUrl, parseRoomCode } from "@/server/validation";

export async function POST(request: Request, context: { params: { code: string } }) {
	try {
		const body = await request.json();
		const code = parseRoomCode(context.params.code);
		if (!code) return NextResponse.json({ error: "Invalid room code" }, { status: 400 });
		const url = parseRequiredUrl(body?.url);
		if (!url) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
		const submitter = parseName(body?.submitter, "Player");
		const title = parseOptionalText(body?.title) ?? "";

		const song = await addSong(code, { url, submitter, title });
		return NextResponse.json(song);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
