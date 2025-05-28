// src/app/api/youtube-search/route.ts
import { NextResponse } from "next/server";

export const config = { runtime: "edge" };

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const q = searchParams.get("q") || "";
	if (!q) {
		return NextResponse.json({ items: [] });
	}
	const key = process.env.YOUTUBE_API_KEY!;
	const youtubeRes = await fetch(
		`https://www.googleapis.com/youtube/v3/search` +
			`?part=snippet&type=video&maxResults=5` +
			`&q=${encodeURIComponent(q)}` +
			`&key=${key}`
	);
	const body = await youtubeRes.json();
	return NextResponse.json(body);
}
