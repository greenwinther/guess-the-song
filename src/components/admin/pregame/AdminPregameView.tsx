"use client";

import { useEffect, useState } from "react";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import AdminHeader from "@/components/admin/common/AdminHeader";
import AdminPlaylistPanel from "./playlist/AdminPlaylistPanel";
import AdminSongSetupPanel from "./song-setup/AdminSongSetupPanel";

export default function AdminPregameView({ room, roomCode }: { room: Room | null; roomCode: string }) {
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
			<AdminHeader roomCode={roomCode} />

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.72fr)]">
				<AdminSongSetupPanel
					room={room}
					inLobby={inLobby}
					editingSong={editingSong}
					onFinishEditing={() => setEditingSong(null)}
				/>

				<AdminPlaylistPanel
					room={room}
					inLobby={inLobby}
					onEditSong={setEditingSong}
					onImportComplete={() => setEditingSong(null)}
				/>
			</div>
		</section>
	);
}
