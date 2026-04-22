"use client";

import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import type { Room } from "@/types/room";
import {
	parseAdminSetupImport,
	roomHasAdminSetupContent,
} from "@/components/admin/pregame/playlist/adminSetupTransfer";

const emitWithResult = <TResult>(invoke: (cb: (result: TResult) => void) => void): Promise<TResult> =>
	new Promise((resolve) => {
		invoke(resolve);
	});

export function useAdminSetupImport({
	room,
	onImportComplete,
}: {
	room: Room;
	onImportComplete?: () => void;
}) {
	const socket = useSocket();
	const [importing, setImporting] = useState(false);

	const importSetupFile = async (file: File) => {
		const text = await file.text();
		const imported = parseAdminSetupImport(text);

		if (roomHasAdminSetupContent(room)) {
			const confirmed = window.confirm(
				"Importing will replace the current lobby setup, including songs, theme, and bonus question. Continue?",
			);
			if (!confirmed) return;
		}

		setImporting(true);
		onImportComplete?.();

		try {
			for (const song of [...room.songs]) {
				const result = await emitWithResult<{ success: boolean; error?: string }>((cb) =>
					socket.emit("removeSong", { code: room.code, songId: song.id }, cb),
				);
				if (!result.success) {
					throw new Error(result.error || "Could not clear existing songs.");
				}
			}

			const hardcoreOk = await emitWithResult<boolean>((cb) =>
				socket.emit(
					"HARDCORE_REQUIRED",
					{ code: room.code, required: imported.setup.hardcoreRequired },
					cb,
				),
			);
			if (!hardcoreOk) {
				throw new Error("Could not update hardcore mode.");
			}

			socket.emit("THEME_EDIT", { code: room.code, theme: imported.setup.theme });
			socket.emit("DETAIL_QUESTION", { code: room.code, question: imported.setup.detailQuestion });

			for (const song of imported.setup.songs) {
				const result = await emitWithResult<{ success: boolean; error?: string }>((cb) =>
					socket.emit(
						"addSong",
						{
							code: room.code,
							url: song.url,
							submitter: song.submitter,
							title: song.title,
							detailAnswer: song.detailAnswer ?? "",
						},
						cb,
					),
				);
				if (!result.success) {
					throw new Error(result.error || `Could not import song "${song.title || song.url}".`);
				}
			}
		} finally {
			setImporting(false);
		}
	};

	return { importing, importSetupFile };
}
