// src/components/host/HostPlaylistPanel.tsx
"use client";

import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import type { Song } from "@/types/room";

export default function HostPlaylistPanel() {
	const socket = useSocket();
	const { room } = useGame();
	const [revealedId, setRevealedId] = useState<number | null>(null);

	if (!room) return null;

	return (
		<aside className="order-2 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col">
			<h2 className="text-lg sm:text-xl font-semibold text-text mb-3 sm:mb-4">Playlist</h2>

			<div className="bg-card/50 border border-border rounded-lg divide-y divide-border overflow-auto max-h-56 sm:max-h-72 lg:max-h-none">
				{room.songs.map((s: Song, i: number) => {
					const isRevealed = revealedId === s.id;
					return (
						<div
							key={s.id}
							onClick={() => setRevealedId(isRevealed ? null : s.id)}
							className="relative flex items-center px-4 py-3 hover:bg-card/30 cursor-pointer transition"
						>
							<div className="flex items-start gap-3 flex-1">
								<div className="items-center justify-center font-semibold">{i + 1}</div>

								{isRevealed && (
									<div className="flex flex-col">
										<span className="font-semibold text-text">{s.title}</span>
										<span className="text-sm text-text-muted">
											Submitted by {s.submitter}
										</span>
									</div>
								)}
							</div>

							{isRevealed && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										socket.emit(
											"removeSong",
											{ code: room.code, songId: s.id },
											(res: { success: boolean; error?: string }) => {
												if (!res.success)
													alert("Could not remove song: " + res.error);
											}
										);
									}}
									className="absolute top-0 right-0 text-red-500 hover:text-red-400 p-1 text-lg leading-none"
									aria-label="Remove song"
								>
									X
								</button>
							)}
						</div>
					);
				})}
			</div>
		</aside>
	);
}
