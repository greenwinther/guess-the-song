"use client";

import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import styles from "@/components/admin/admin.module.css";
import AdminPlaylistSongList from "./AdminPlaylistSongList";
import AdminSetupTransferControls from "./AdminSetupTransferControls";

type AdminPlaylistPanelProps = {
	room: Room;
	inLobby: boolean;
	onEditSong: (song: Submission) => void;
	onImportComplete: () => void;
};

export default function AdminPlaylistPanel({
	room,
	inLobby,
	onEditSong,
	onImportComplete,
}: AdminPlaylistPanelProps) {
	return (
		<section
			className={`${styles.panel} ${styles.panelSecondary} min-h-[24rem] rounded-2xl border border-border/70 p-4 backdrop-blur-xl`}
		>
			<AdminPlaylistSongList
				room={room}
				onEditSong={inLobby ? onEditSong : undefined}
				listClassName={styles.insetPanel}
				headerAddon={
					<div className="flex min-w-0 items-center gap-2">
						<AdminSetupTransferControls
							room={room}
							inLobby={inLobby}
							onImportComplete={onImportComplete}
							label="Manage"
							className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
						/>
					</div>
				}
			/>
		</section>
	);
}
