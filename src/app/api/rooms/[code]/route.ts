// src/app/api/rooms/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/lib/rooms";

export async function GET(req: NextRequest) {
	// manually extract the last segment of the path as "code"
	const url = new URL(req.url);
	const parts = url.pathname.split("/");
	const code = parts[parts.length - 1];

	try {
		const room = await getRoom(code);
		return NextResponse.json(room);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 404 });
	}
}
