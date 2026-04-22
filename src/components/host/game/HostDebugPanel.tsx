"use client";

import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";

type HostDebugPanelProps = {
	code: string;
	currentIndex: number;
	currentSong: Submission | null;
	lockedForThisRound: string[];
	revealedCount: number;
	room: Room | null;
	songCount: number;
};

export default function HostDebugPanel({
	code,
	currentIndex,
	currentSong,
	lockedForThisRound,
	revealedCount,
	room,
	songCount,
}: HostDebugPanelProps) {
	const socket = useSocket();
	const roomCode = room?.code ?? code;

	return (
		<div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-border bg-card/90 p-3 text-xs text-text shadow-xl backdrop-blur">
			<div className="mb-2 text-[10px] uppercase tracking-widest text-text/60">Debug</div>
			<div>Room: {roomCode}</div>
			<div>Phase: {room?.phase ?? "?"}</div>
			<div>Active song: {currentSong ? `${currentIndex + 1}/${songCount}` : "none"}</div>
			<div>Revealed: {revealedCount}</div>
			<div>Players: {room?.players?.length ?? 0}</div>
			<div>Locked this round: {lockedForThisRound.length}</div>
			<div className="mt-2">
				<button
					className="rounded-md border border-border bg-card/80 px-2 py-1 text-[10px] uppercase tracking-widest text-text/80 hover:bg-card"
					onClick={() => {
						socket.emit("DEV_RESYNC", { code: roomCode }, (ok) => {
							if (!ok) toast.error("Resync failed.");
						});
					}}
				>
					Force resync
				</button>
				<button
					className="ml-2 rounded-md border border-border bg-card/80 px-2 py-1 text-[10px] uppercase tracking-widest text-text/80 hover:bg-card"
					onClick={() => {
						socket.emit("DEV_SNAPSHOT", { code: roomCode }, (ok) => {
							if (!ok) toast.error("Snapshot failed.");
						});
					}}
				>
					Dump snapshot
				</button>
			</div>
			<div className="mt-2 text-[10px] text-text/60">Press D to toggle</div>
		</div>
	);
}
