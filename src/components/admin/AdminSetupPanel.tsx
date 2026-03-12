"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { useSocket } from "@/contexts/SocketContext";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import Button from "@/components/ui/Button";
import SongSetupForm from "@/components/control/SongSetupForm";
import SetupPlaylistPanel from "@/components/control/SetupPlaylistPanel";
import { ThemeEditorControls } from "@/components/control/ThemeEditorControls";
import { DetailQuestionEditorControls } from "@/components/control/DetailQuestionEditorControls";

export default function AdminSetupPanel({ room, roomCode }: { room: Room | null; roomCode: string }) {
	const socket = useSocket();
	const [previewUrl, setPreviewUrl] = useState("");
	const [hardcoreRequired, setHardcoreRequired] = useState(false);
	const [editingSong, setEditingSong] = useState<Submission | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);

	useEffect(() => {
		setHardcoreRequired(!!room?.hardcoreRequired);
	}, [room?.hardcoreRequired]);

	useEffect(() => {
		if (!room || !editingSong) return;
		const nextSong = room.songs.find((song) => song.id === editingSong.id) ?? null;
		setEditingSong(nextSong);
	}, [room, editingSong]);

	const inLobby = room?.phase === undefined || room?.phase === "LOBBY";

	useEffect(() => {
		if (!room) return;
		if (!inLobby) {
			setIsCollapsed(true);
			setEditingSong(null);
		}
	}, [inLobby, room]);

	if (!room) {
		return (
			<section className="space-y-2">
				<h2 className="text-lg font-semibold text-text">Room Setup</h2>
				<p className="text-sm text-text/70">Waiting for room state...</p>
			</section>
		);
	}

	return (
		<section className="flex flex-col gap-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-semibold text-text">Room Setup</h2>
					<p className="text-sm text-text/70">
						Editor-only controls for songs, theme, detail answers, and lobby rules.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => window.open(`/control/${roomCode}`, "_blank", "noopener,noreferrer")}
					>
						Open host control
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => setIsCollapsed((prev) => !prev)}
						aria-expanded={!isCollapsed}
						aria-controls="admin-setup-content"
					>
						{isCollapsed ? "Show setup" : "Hide setup"}
					</Button>
					<span className="rounded-full border border-border/70 bg-card/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-text/70">
						{inLobby ? "Editable" : "Locked after start"}
					</span>
				</div>
			</div>

			{!isCollapsed && (
				<div id="admin-setup-content" className="flex flex-col gap-4">
					{!inLobby && (
						<div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-100">
							Setup is read-only once the live game has started.
						</div>
					)}

					<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]">
						<div className="flex h-full flex-col gap-3">
							<DetailQuestionEditorControls
								code={room.code}
								detailQuestion={room.detailQuestion}
								disabled={!inLobby}
							/>
						</div>
						<div className="flex h-full flex-col gap-3">
							<ThemeEditorControls code={room.code} themeValue={room.theme ?? ""} disabled={!inLobby} />
						</div>
						<div className="flex h-full flex-col gap-3">
							<div className="flex flex-col gap-1">
								<h3 className="text-sm font-semibold text-text">Lobby rules</h3>
								<p className="text-xs text-text/70">Set live requirements before the room is started.</p>
							</div>
							<div className="flex items-center justify-between gap-3">
								<span className="text-sm text-text/80">Hardcore mode</span>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										id="admin-hardcore-required"
										type="checkbox"
										className="sr-only peer"
										checked={hardcoreRequired}
										disabled={!inLobby}
										onChange={(e) => {
											const required = e.target.checked;
											setHardcoreRequired(required);
											socket.emit("HARDCORE_REQUIRED", { code: room.code, required }, (ok) => {
												if (!ok) {
													setHardcoreRequired(!!room.hardcoreRequired);
													alert("Failed to update hardcore rule");
												}
											});
										}}
									/>
									<span className="h-6 w-10 rounded-full border border-border bg-card/60 transition-colors peer-checked:border-primary/50 peer-checked:bg-primary/50" />
									<span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white/80 transition-transform peer-checked:translate-x-4" />
								</label>
							</div>
						</div>
					</div>

					<SongSetupForm
						code={room.code}
						onUrlChange={setPreviewUrl}
						disabled={!inLobby}
						editingSong={editingSong}
						onFinishEditing={() => setEditingSong(null)}
					/>

					<div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
						<div className="rounded-lg overflow-hidden border border-border aspect-video bg-black/20">
							<ReactPlayer url={previewUrl} controls width="100%" height="100%" />
						</div>
						<div className="min-h-[18rem] rounded-lg border border-border bg-card/20">
							<SetupPlaylistPanel
								roomOverride={room}
								allowRemoval={inLobby}
								showDevTools={true}
								embedded
								alwaysExpanded
								onEditSong={inLobby ? setEditingSong : undefined}
							/>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
