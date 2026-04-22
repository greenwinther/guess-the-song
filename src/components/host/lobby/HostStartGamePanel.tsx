"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import Button from "@/components/shared/Button";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

import type { Room } from "@/types/room";

type HostStartGamePanelProps = {
	allPlayersReady: boolean;
	nonHostPlayerCount: number;
	room: Room;
};

export default function HostStartGamePanel({
	allPlayersReady,
	nonHostPlayerCount,
	room,
}: HostStartGamePanelProps) {
	const socket = useSocket();
	const [confirmStartOpen, setConfirmStartOpen] = useState(false);

	const emitStartGame = () => {
		setConfirmStartOpen(false);
		socket.emit("startGame", { code: room.code }, (ok: boolean) => {
			if (!ok) toast.error("Could not start game.");
		});
	};

	const startGame = () => {
		if (room.songs.length === 0) {
			toast.error("Add at least one song before starting.");
			return;
		}
		if (nonHostPlayerCount > 0 && !allPlayersReady) {
			setConfirmStartOpen(true);
			return;
		}
		emitStartGame();
	};

	return (
		<main className="lg:col-span-6 flex items-center justify-center p-4 sm:p-6 pt-6 sm:pt-8">
			<Button
				onClick={startGame}
				variant="primary"
				size="lg"
				className="w-full max-w-md py-4 text-xl sm:text-2xl"
			>
				Start Game
			</Button>
			<ConfirmDialog
				open={confirmStartOpen}
				title="Start game?"
				description="Not all players are ready. Start the game anyway?"
				confirmLabel="Start anyway"
				onConfirm={emitStartGame}
				onCancel={() => setConfirmStartOpen(false)}
			/>
		</main>
	);
}
