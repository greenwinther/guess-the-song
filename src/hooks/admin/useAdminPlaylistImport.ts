"use client";

import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import type { Room } from "@/types/room";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "").replace(
	/\/$/,
	"",
);
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export const PLAYLIST_IMPORT_LIMIT = 25;
const PLAYLIST_IMPORT_SUBMITTER = "Playlist";

type ImportedPlaylistSong = {
	videoId: string;
	title: string;
	url: string;
};

const emitWithResult = <TResult>(invoke: (cb: (result: TResult) => void) => void): Promise<TResult> =>
	new Promise((resolve) => {
		invoke(resolve);
	});

export function useAdminPlaylistImport({
	room,
	onImportComplete,
}: {
	room: Room;
	onImportComplete?: () => void;
}) {
	const socket = useSocket();
	const [importingPlaylist, setImportingPlaylist] = useState(false);

	const importPlaylist = async () => {
		const playlistUrl = window.prompt(
			`Paste a public or unlisted YouTube playlist URL. Up to ${PLAYLIST_IMPORT_LIMIT} songs will be imported.`,
			"",
		)?.trim();
		if (!playlistUrl) return { imported: 0, duplicates: 0, truncated: false };

		setImportingPlaylist(true);
		onImportComplete?.();

		try {
			const response = await fetch(
				apiUrl(
					`/api/youtube-playlist?url=${encodeURIComponent(playlistUrl)}&limit=${PLAYLIST_IMPORT_LIMIT}`,
				),
			);
			const body = (await response.json()) as {
				error?: string;
				items?: ImportedPlaylistSong[];
				truncated?: boolean;
			};

			if (!response.ok) {
				throw new Error(body.error || "Could not load playlist.");
			}

			if (!body.items?.length) {
				throw new Error("No playable public videos were found in that playlist.");
			}

			const existingUrls = new Set(room.songs.map((song) => song.url.trim().toLowerCase()));
			let imported = 0;
			let duplicates = 0;

			for (const song of body.items ?? []) {
				const normalizedUrl = song.url.trim().toLowerCase();
				if (existingUrls.has(normalizedUrl)) {
					duplicates += 1;
					continue;
				}

				const result = await emitWithResult<{ success: boolean; error?: string }>((cb) =>
					socket.emit(
						"addSong",
						{
							code: room.code,
							url: song.url,
							submitter: PLAYLIST_IMPORT_SUBMITTER,
							title: song.title,
							detailAnswer: "",
						},
						cb,
					),
				);

				if (!result.success) {
					if ((result.error || "").toLowerCase() === "duplicate song") {
						duplicates += 1;
						continue;
					}
					throw new Error(result.error || `Could not import song "${song.title}".`);
				}

				existingUrls.add(normalizedUrl);
				imported += 1;
			}

			return {
				imported,
				duplicates,
				truncated: Boolean(body.truncated),
			};
		} finally {
			setImportingPlaylist(false);
		}
	};

	return {
		importPlaylist,
		importingPlaylist,
	};
}
