"use client";

import type { Room } from "@/types/room";

type HostLobbyDebugPanelProps = {
	nonHostPlayerCount: number;
	readyCount: number;
	room: Room;
};

export default function HostLobbyDebugPanel({
	nonHostPlayerCount,
	readyCount,
	room,
}: HostLobbyDebugPanelProps) {
	return (
		<div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-border bg-card/90 p-3 text-xs text-text shadow-xl backdrop-blur">
			<div className="mb-2 text-[10px] uppercase tracking-widest text-text/60">Debug</div>
			<div>Room: {room.code}</div>
			<div>Phase: {room.phase ?? "LOBBY"}</div>
			<div>Players: {room.players.length}</div>
			<div>
				Ready: {readyCount}/{nonHostPlayerCount}
			</div>
			<div>Songs: {room.songs.length}</div>
			<div className="mt-2 text-[10px] text-text/60">Press D to toggle</div>
		</div>
	);
}
