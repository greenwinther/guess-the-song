// src/app/api/rooms/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/lib/rooms";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
	try {
		// add await here
		const room = await getRoom(params.code);
		return NextResponse.json(room);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 404 });
	}
}
