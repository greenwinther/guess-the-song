// src/app/api/rooms/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/rooms";

export async function POST(req: NextRequest) {
	const { theme, backgroundUrl } = await req.json();
	const room = await createRoom(theme, backgroundUrl);
	return NextResponse.json({ code: room.code });
}
