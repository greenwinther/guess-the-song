"use client";

import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import Button from "@/components/shared/Button";
import LobbyPlaylistPanel from "@/components/shared/LobbyPlaylistPanel";
import AdminHomeLink from "@/components/admin/components/AdminHomeLink";
import AdminSetupTransferControls from "@/components/admin/setup/AdminSetupTransferControls";
import styles from "@/components/admin/admin.module.css";
import AdminSongSetupForm from "./AdminSongSetupForm";
import AdminThemeEditorControls from "./AdminThemeEditorControls";
import AdminDetailQuestionEditorControls from "./AdminDetailQuestionEditorControls";

export default function AdminSetupPanel({ room, roomCode }: { room: Room | null; roomCode: string }) {
	const [previewUrl, setPreviewUrl] = useState("");
	const [editingSong, setEditingSong] = useState<Submission | null>(null);

	useEffect(() => {
		if (!room || !editingSong) return;
		const nextSong = room.songs.find((song) => song.id === editingSong.id) ?? null;
		setEditingSong(nextSong);
	}, [room, editingSong]);

	const inLobby = room?.phase === undefined || room?.phase === "LOBBY";

	if (!room) {
		return (
			<section className="space-y-2">
				<h2 className="text-lg font-semibold text-text">Room Setup</h2>
				<p className="text-sm text-text/70">Waiting for room state...</p>
			</section>
		);
	}

	return (
		<section className="flex w-full flex-col gap-5">
			<header
				className={`${styles.panel} ${styles.panelOpen} ${styles.panelPrimary} z-20 grid items-center gap-4 rounded-b-2xl border border-border/70 border-t-0 p-4 md:grid-cols-[1fr_auto_1fr]`}
			>
				<div />
				<AdminHomeLink className="justify-self-start text-center md:justify-self-center" />
				<div className="self-end justify-self-end">
					<Button
						variant="secondary"
						size="sm"
						className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
						onClick={() => window.open(`/control/${roomCode}`, "_blank", "noopener,noreferrer")}
					>
						Open host control
					</Button>
				</div>
			</header>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.72fr)]">
				<section
					className={`${styles.panel} ${styles.panelPrimary} rounded-2xl border border-border/70 p-5 backdrop-blur-xl`}
				>
					<div className="flex min-w-0 flex-col gap-6">
					{!inLobby && (
						<div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-100">
							Setup is read-only once the live game has started.
						</div>
					)}

						<section className="flex min-w-0 flex-col gap-5">
							<div className="flex items-center justify-between gap-3">
								<h2 className="text-xl font-semibold text-text sm:text-[1.4rem]">Song Setup</h2>
							</div>
							<div className={`${styles.insetPanel} rounded-xl px-4 py-1`}>
								<div className="grid gap-4 xl:grid-cols-2">
									<AdminDetailQuestionEditorControls
										code={room.code}
										detailQuestion={room.detailQuestion}
										disabled={!inLobby}
									/>
									<AdminThemeEditorControls
										code={room.code}
										themeValue={room.theme ?? ""}
										disabled={!inLobby}
									/>
								</div>
							</div>
							<div>
								<AdminSongSetupForm
									code={room.code}
									onUrlChange={setPreviewUrl}
									showDetailAnswer={Boolean(room.detailQuestion?.trim())}
									disabled={!inLobby}
									editingSong={editingSong}
									onFinishEditing={() => setEditingSong(null)}
								/>
							</div>
							<div>
								<div
									className={`${styles.insetPanel} aspect-video overflow-hidden rounded-lg border border-border/50`}
								>
									{previewUrl ? (
										<ReactPlayer url={previewUrl} controls width="100%" height="100%" />
									) : (
										<div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-text/60">
											Search a song to preview
										</div>
									)}
								</div>
							</div>
						</section>
					</div>
				</section>

				<section
					className={`${styles.panel} ${styles.panelSecondary} min-h-[24rem] rounded-2xl border border-border/70 p-4 backdrop-blur-xl`}
				>
					<LobbyPlaylistPanel
						roomOverride={room}
						allowRemoval={inLobby}
						showDevTools={true}
						embedded
						alwaysExpanded
						onEditSong={inLobby ? setEditingSong : undefined}
						listClassName={styles.insetPanel}
						headerAddon={
							<div className="flex min-w-0 items-center gap-2">
								<AdminSetupTransferControls
									room={room}
									inLobby={inLobby}
									onImportComplete={() => setEditingSong(null)}
									label="Manage"
									className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
								/>
							</div>
						}
					/>
				</section>
			</div>
		</section>
	);
}
