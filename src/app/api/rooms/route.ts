// src/app/api/rooms/route.ts

import { NextResponse } from "next/server";
import { createRoom } from "@/lib/rooms";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { theme, backgroundUrl } = body;

		const newRoom = await createRoom(
			theme?.trim() || "", // fallback to empty string
			backgroundUrl?.trim() || null,
			"Host" // ✅ default host name hardcoded here
		);

		return NextResponse.json({ code: newRoom.code });
	} catch (err) {
		console.error(err);
		return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
	}
}
