"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import Button from "@/components/shared/Button";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import LobbyChecklist from "@/components/shared/lobby/LobbyChecklist";
import ReadinessProgress from "@/components/shared/lobby/ReadinessProgress";
import { CENTER_LOBBY_PANEL_CLASS } from "@/components/shared/layout/panelClassNames";
import { FaCheck, FaMusic, FaPlay, FaUsers } from "react-icons/fa";

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
	const nonHostPlayers = room.players.filter((player) => !player.isHost);
	const readyCount = nonHostPlayers.filter((player) => player.ready).length;
	const hasSongs = room.songs.length > 0;
	const hasPlayers = nonHostPlayerCount > 0;
	const setupItems = [
		{
			icon: FaUsers,
			label: "Players",
			value: hasPlayers
				? `${readyCount}/${nonHostPlayerCount} ready`
				: "Waiting for players",
			complete: hasPlayers && allPlayersReady,
		},
		{
			icon: FaMusic,
			label: "Playlist",
			value: room.songs.length === 1 ? "1 song added" : `${room.songs.length} songs added`,
			complete: hasSongs,
		},
		{
			icon: FaCheck,
			label: "Start status",
			value: hasSongs ? "Ready when you are" : "Add a song first",
			complete: hasSongs,
		},
	];

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
		<main className={CENTER_LOBBY_PANEL_CLASS}>
			<div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-12 text-center">
				<div className="flex flex-col items-center gap-5">
					<h2 className="w-full max-w-[31rem] whitespace-nowrap text-3xl font-extrabold leading-tight text-text sm:text-4xl">
						Host lobby
					</h2>
					<p className="max-w-md text-sm leading-relaxed text-text-muted sm:text-base">
						Keep an eye on readiness, then open the room into game mode.
					</p>
				</div>

				<ReadinessProgress readyCount={readyCount} totalCount={nonHostPlayerCount} />
				<LobbyChecklist items={setupItems} />

				<Button
					onClick={startGame}
					variant="primary"
					size="lg"
					className="w-full max-w-[31rem] py-4 text-xl sm:text-2xl"
				>
					<FaPlay className="h-4 w-4" aria-hidden="true" />
					Start Game
				</Button>
			</div>
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
