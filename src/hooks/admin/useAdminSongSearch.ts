"use client";

import { useCallback, useEffect, useState } from "react";
import { getYouTubeID } from "@/lib/youtube";

export type AdminSongSearchResult = {
	id: { videoId: string };
	snippet: {
		title: string;
		thumbnails: {
			default: { url: string };
		};
	};
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "").replace(
	/\/$/,
	"",
);
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export function useAdminSongSearch({ onUrlChange }: { onUrlChange?: (url: string) => void }) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<AdminSongSearchResult[]>([]);
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const [url, setUrl] = useState("");
	const [title, setTitle] = useState("");
	const [searchError, setSearchError] = useState<string | null>(null);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedQuery(query);
		}, 500);
		return () => clearTimeout(handler);
	}, [query]);

	useEffect(() => {
		if (!debouncedQuery) {
			setResults([]);
			setSearchError(null);
			return;
		}

		const controller = new AbortController();
		fetch(apiUrl(`/api/youtube-search?q=${encodeURIComponent(debouncedQuery)}`), {
			signal: controller.signal,
		})
			.then(async (response) => {
				const json = await response.json();
				if (!response.ok) {
					throw new Error(json?.error || "Search failed");
				}
				setResults(json.items || []);
				setSearchError(null);
			})
			.catch((error: unknown) => {
				if ((error as { name?: string })?.name === "AbortError") return;
				setResults([]);
				setSearchError("Could not load search results. Try again.");
			});

		return () => controller.abort();
	}, [debouncedQuery]);

	useEffect(() => {
		const videoId = getYouTubeID(url);
		if (videoId) {
			fetch(apiUrl(`/api/youtube-title?id=${videoId}`))
				.then((response) => response.json())
				.then((json) => setTitle(json.title || ""))
				.catch(() => setTitle(""));
		} else {
			setTitle("");
		}
	}, [url]);

	useEffect(() => {
		onUrlChange?.(url);
	}, [url, onUrlChange]);

	const resetSongSearch = useCallback(({ nextUrl = "", nextTitle = "" } = {}) => {
		setQuery("");
		setResults([]);
		setUrl(nextUrl);
		setTitle(nextTitle);
		setSearchError(null);
	}, []);

	const updateSongInput = useCallback((value: string) => {
		setTitle("");
		if (/youtu/.test(value)) {
			setUrl(value);
			setQuery("");
			return;
		}
		setQuery(value);
		setUrl("");
	}, []);

	const selectSearchResult = useCallback((video: AdminSongSearchResult) => {
		setUrl(`https://www.youtube.com/watch?v=${video.id.videoId}`);
		setTitle(video.snippet.title);
		setResults([]);
	}, []);

	return {
		url,
		title,
		searchError,
		searchResults: results,
		songInputValue: title || query || url,
		resetSongSearch,
		updateSongInput,
		selectSearchResult,
	};
}
