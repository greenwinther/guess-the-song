// src/app/api/rooms/[code]/route.ts
// Legacy/fallback HTTP endpoint (currently unused by the app).
import { NextResponse } from "next/server";
import { getRoom } from "@/lib/rooms";
import { roomCodeParamsSchema, validateWithZod } from "@/server/schemas";
import { toPublicRoom } from "@/server/state/publicRoom";

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
	const params = await context.params;
	const parsedParams = validateWithZod(roomCodeParamsSchema, params, {
		errorMessage: "Invalid room code",
	});
	if (!parsedParams.ok) {
		return NextResponse.json({ error: parsedParams.error, issues: parsedParams.issues }, { status: 400 });
	}

	try {
		const room = await getRoom(parsedParams.data.code);
		return NextResponse.json(toPublicRoom(room));
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 404 });
	}
}
