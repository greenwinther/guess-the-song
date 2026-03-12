// src/components/control/SetupPlaylistPanel.tsx
"use client";

import { useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useRoomState } from "@/contexts/gameContext";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import Button from "../ui/Button";

export default function SetupPlaylistPanel({
	roomOverride,
	allowRemoval = true,
	showDevTools = true,
	embedded = false,
	alwaysExpanded = false,
	onEditSong,
}: {
	roomOverride?: Room | null;
	allowRemoval?: boolean;
	showDevTools?: boolean;
	embedded?: boolean;
	alwaysExpanded?: boolean;
	onEditSong?: (song: Submission) => void;
}) {
	const socket = useSocket();
	const { room } = useRoomState();
	const [revealedId, setRevealedId] = useState<number | null>(null);
	const isDev = process.env.NODE_ENV !== "production";
	const viewRoom = roomOverride ?? room;

	if (!viewRoom) return null;

	return (
		<aside
			className={
				embedded
					? "h-full p-4 flex flex-col"
					: "order-2 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 pt-6 sm:pt-8 border-t lg:border-t-0 lg:border-l border-border flex flex-col"
			}
		>
			<h2 className="text-lg sm:text-xl font-semibold text-text mb-3 sm:mb-4">Playlist</h2>
			<div className="bg-card/50 border border-border rounded-lg divide-y divide-border overflow-auto max-h-56 sm:max-h-72 lg:max-h-none">
				{viewRoom.songs.map((s: Submission, i: number) => {
					const isRevealed = alwaysExpanded || revealedId === s.id;
					return (
						<div
							key={s.id}
							onClick={() => {
								if (alwaysExpanded) return;
								setRevealedId(isRevealed ? null : s.id);
							}}
							className={`relative flex items-center px-4 py-3 transition ${
								alwaysExpanded ? "" : "cursor-pointer hover:bg-card/30"
							}`}
						>
							<div className="flex items-start gap-3 flex-1">
								<div className="items-center justify-center font-semibold">{i + 1}</div>

								{isRevealed && (
									<div className="flex flex-col">
										<span className="font-semibold text-text">{s.title}</span>
										<span className="text-sm text-text-muted">
											Submitted by {s.submitter}
											{viewRoom.detailQuestion && s.detailAnswer && (
												<>
													{" · "}Answer: {s.detailAnswer}
												</>
											)}
										</span>
									</div>
								)}
							</div>

							{isRevealed && (allowRemoval || onEditSong) && (
								<div className="ml-3 flex shrink-0 flex-col items-stretch gap-2 self-start">
									{allowRemoval && (
										<Button
											type="button"
											variant="danger"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												socket.emit(
													"removeSong",
													{ code: viewRoom.code, songId: s.id },
													(res: { success: boolean; error?: string }) => {
														if (!res.success) {
															alert("Could not remove song: " + res.error);
														}
													}
												);
											}}
											aria-label="Remove song"
										>
											Remove
										</Button>
									)}
									{onEditSong && (
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												onEditSong(s);
											}}
										>
											Edit
										</Button>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{isDev && showDevTools && (
				<div className="mt-auto pt-4 flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								socket.emit(
									"DEV_SEED",
									{ code: viewRoom.code, players: 3, songs: 5, ready: true },
									(ok) => {
										if (!ok) alert("Failed to seed demo data");
									}
								);
							}}
						>
							Seed demo data
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								socket.emit("DEV_RESYNC", { code: viewRoom.code }, (ok) => {
									if (!ok) alert("Resync failed");
								});
							}}
						>
							Force resync
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								socket.emit("DEV_SNAPSHOT", { code: viewRoom.code }, (ok) => {
									if (!ok) alert("Snapshot failed");
								});
							}}
						>
							Dump snapshot
						</Button>
					</div>
					<span className="text-xs text-text/60">
						Adds 3 players + 5 songs (dev only). Resync re-emits room/snapshots.
					</span>
				</div>
			)}
		</aside>
	);
}

