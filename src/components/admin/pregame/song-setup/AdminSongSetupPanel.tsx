"use client";

import { useState } from "react";
import ReactPlayer from "react-player";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import styles from "@/components/admin/admin.module.css";
import AdminBonusQuestionEditor from "./AdminBonusQuestionEditor";
import AdminSongSetupForm from "./AdminSongSetupForm";
import AdminThemeEditor from "./AdminThemeEditor";

type AdminSongSetupPanelProps = {
	room: Room;
	inLobby: boolean;
	editingSong: Submission | null;
	onFinishEditing: () => void;
};

export default function AdminSongSetupPanel({
	room,
	inLobby,
	editingSong,
	onFinishEditing,
}: AdminSongSetupPanelProps) {
	const [previewUrl, setPreviewUrl] = useState("");

	return (
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
							<AdminBonusQuestionEditor
								code={room.code}
								detailQuestion={room.detailQuestion}
								disabled={!inLobby}
							/>
							<AdminThemeEditor
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
							onFinishEditing={onFinishEditing}
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
	);
}
