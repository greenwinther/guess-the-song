// src/app/api/rooms/[code]/songs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addSong } from "@/lib/rooms";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
	try {
		const { url, submitter } = await req.json();

		const song = await addSong(params.code, { url, submitter });
		return NextResponse.json(song);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 400 });
	}
}
