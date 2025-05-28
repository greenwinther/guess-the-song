// src/lib/youtube.ts

/** Extracts the “v=” ID from a YouTube URL, or null if none */
export function getYouTubeID(url: string): string | null {
	const m = url.match(/[?&]v=([^&]+)/);
	return m ? m[1] : null;
}
