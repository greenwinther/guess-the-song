// src/app/api/rooms/[code]/songs/route.ts
import { NextResponse } from "next/server";
import { addSong } from "@/lib/rooms";

export async function POST(request: Request, context: any) {
	try {
		const { url, submitter } = await request.json();
		const song = await addSong(context.params.code, {
			url,
			submitter,
			title: "",
		});
		return NextResponse.json(song);
	} catch (err: any) {
		return NextResponse.json({ error: err.message }, { status: 400 });
	}
}
