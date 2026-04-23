"use client";

import type { ReactNode } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import { getYouTubeID } from "@/lib/youtube";
import Image from "next/image";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import Button from "@/components/shared/Button";

export default function AdminPlaylistSongList({
	room,
	onEditSong,
	headerAddon,
	listClassName = "",
}: {
	room: Room;
	onEditSong?: (song: Submission) => void;
	headerAddon?: ReactNode;
	listClassName?: string;
}) {
	const socket = useSocket();
	const isDev = process.env.NODE_ENV !== "production";

	return (
		<aside className="flex h-full flex-col gap-5">
			<div className="flex items-center justify-between gap-3 rounded-lg px-3 py-0">
				<h2 className="text-lg font-semibold text-text sm:text-xl">Playlist</h2>
				{headerAddon}
			</div>

			<div
				className={`max-h-56 overflow-auto rounded-lg bg-transparent px-2 py-2 sm:max-h-72 lg:max-h-none ${listClassName}`.trim()}
			>
				{room.songs.map((song: Submission, index: number) => {
					const videoId = getYouTubeID(song.url);
					const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null;
					const canEditRow = Boolean(onEditSong);

					return (
						<div
							key={song.id}
							onClick={() => {
								if (canEditRow) {
									onEditSong?.(song);
								}
							}}
							className={`relative py-1 flex items-center rounded-md transition ${
								canEditRow ? "cursor-pointer hover:bg-black/20" : ""
							}`}
						>
							<div className="flex flex-1 items-start gap-2">
								<div className="flex w-6 shrink-0 items-center justify-center self-center text-center text-sm font-semibold tabular-nums text-text/80">
									{index + 1}
								</div>

								<div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-black/20">
									{thumbnailUrl ? (
										<Image
											src={thumbnailUrl}
											alt=""
											width={160}
											height={90}
											className="h-full w-full object-cover"
											unoptimized={false}
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-[0.65rem] text-text/45">
											No image
										</div>
									)}
								</div>

								<div className="flex h-12 min-w-0 flex-col">
									<span className="block w-full overflow-hidden text-sm font-semibold leading-[0.95rem] text-text [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
										{song.title}
									</span>
									<span className="text-xs leading-[0.85rem] text-text-muted pt-1">
										Submitted by {song.submitter}
										{room.detailQuestion && song.detailAnswer && (
											<>
												{" | "}Answer: {song.detailAnswer}
											</>
										)}
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{isDev && (
				<div className="mt-auto flex flex-col gap-2 pt-4">
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								socket.emit(
									"DEV_SEED",
									{ code: room.code, players: 10, songs: 10, ready: true },
									(ok) => {
										if (!ok) toast.error("Failed to seed demo data.");
									},
								);
							}}
						>
							Seed demo data
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								socket.emit("DEV_RESYNC", { code: room.code }, (ok) => {
									if (!ok) toast.error("Resync failed.");
								});
							}}
						>
							Force resync
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								socket.emit("DEV_SNAPSHOT", { code: room.code }, (ok) => {
									if (!ok) toast.error("Snapshot failed.");
								});
							}}
						>
							Dump snapshot
						</Button>
					</div>
					<span className="text-xs text-text/60">
						Adds 10 players + 10 songs (dev only). Resync re-emits room/snapshots.
					</span>
				</div>
			)}
		</aside>
	);
}
