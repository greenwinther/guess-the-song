// src/app/api/rooms/[code]/songs/route.ts
// Legacy/fallback HTTP endpoint (currently unused by the app).
import { NextResponse } from "next/server";
import { addSong } from "@/lib/rooms";
import { addSongBodySchema, roomCodeParamsSchema, validateWithZod } from "@/server/schemas";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
	try {
		const body = await request.json();
		const params = await context.params;
		const parsedParams = validateWithZod(roomCodeParamsSchema, params, {
			errorMessage: "Invalid room code",
		});
		if (!parsedParams.ok) {
			return NextResponse.json({ error: parsedParams.error, issues: parsedParams.issues }, { status: 400 });
		}

		const parsedBody = validateWithZod(addSongBodySchema, body, {
			errorMessage: "Invalid request body",
		});
		if (!parsedBody.ok) {
			return NextResponse.json({ error: parsedBody.error, issues: parsedBody.issues }, { status: 400 });
		}

		const song = await addSong(parsedParams.data.code, {
			url: parsedBody.data.url,
			submitter: parsedBody.data.submitter,
			title: parsedBody.data.title,
			detailAnswer: parsedBody.data.detailAnswer,
		});
		return NextResponse.json(song);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
