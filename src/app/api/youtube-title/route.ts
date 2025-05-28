// src/app/api/youtube-title/route.ts
import { NextResponse } from "next/server";

export const config = { runtime: "edge" };

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) return NextResponse.json({ title: "" });

	const key = process.env.YOUTUBE_API_KEY!;
	const youtubeRes = await fetch(
		`https://www.googleapis.com/youtube/v3/videos` +
			`?part=snippet&id=${encodeURIComponent(id)}` +
			`&key=${key}`
	);
	const json = await youtubeRes.json();
	const title = json.items?.[0]?.snippet?.title || "";
	return NextResponse.json({ title });
}
