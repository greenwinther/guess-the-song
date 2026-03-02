// src/app/api/rooms/route.ts
// Legacy/fallback HTTP endpoint (currently unused by the app).

import { NextResponse } from "next/server";
import { createRoom } from "@/lib/rooms";
import { createRoomBodySchema, validateWithZod } from "@/server/schemas";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const parsedBody = validateWithZod(createRoomBodySchema, body, {
			errorMessage: "Invalid request body",
		});
		if (!parsedBody.ok) {
			return NextResponse.json({ error: parsedBody.error, issues: parsedBody.issues }, { status: 400 });
		}

		const newRoom = await createRoom(
			parsedBody.data.theme,
			parsedBody.data.backgroundUrl,
			parsedBody.data.hostName,
			undefined
		);

		return NextResponse.json({ code: newRoom.code });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Failed to create room";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

