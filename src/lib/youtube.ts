// src/lib/youtube.ts

/** Extracts the "v=" ID from a YouTube URL, or null if none */
export function getYouTubeID(url: string): string | null {
	const trimmed = (url ?? "").trim();
	if (!trimmed) return null;

	// Standard watch URLs
	const match = trimmed.match(/[?&]v=([^&]+)/);
	if (match?.[1]) return match[1];

	// Short links: youtu.be/<id>
	const short = trimmed.match(/youtu\.be\/([^?&/]+)/);
	if (short?.[1]) return short[1];

	// Embed URLs: youtube.com/embed/<id>
	const embed = trimmed.match(/youtube\.com\/embed\/([^?&/]+)/);
	if (embed?.[1]) return embed[1];

	return null;
}
