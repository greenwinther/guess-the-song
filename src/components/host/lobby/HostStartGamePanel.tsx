"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import Button from "@/components/shared/Button";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
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
	const readyPercent =
		nonHostPlayerCount > 0 ? Math.round((readyCount / nonHostPlayerCount) * 100) : 0;
	const readyCircumference = 2 * Math.PI * 42;
	const readyStrokeOffset = readyCircumference * (1 - readyPercent / 100);
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
		<main className="order-2 relative flex min-h-[36rem] w-full flex-col justify-start p-5 pt-10 sm:p-7 sm:pt-14 lg:order-none lg:col-span-6">
			<div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-12 text-center">
				<div className="flex flex-col items-center gap-5">
					<h2 className="w-full max-w-[31rem] whitespace-nowrap text-3xl font-extrabold leading-tight text-text sm:text-4xl">
						Host lobby
					</h2>
					<p className="max-w-md text-sm leading-relaxed text-text-muted sm:text-base">
						Keep an eye on readiness, then open the room into game mode.
					</p>
				</div>

				<div className="flex flex-col items-center gap-4">
					<div className="relative grid h-28 w-28 place-items-center rounded-full bg-card/25 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
						<svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
							<circle
								cx="50"
								cy="50"
								r="42"
								fill="none"
								stroke="rgb(var(--color-border-rgb) / 0.7)"
								strokeWidth="8"
							/>
							<circle
								cx="50"
								cy="50"
								r="42"
								fill="none"
								stroke="rgb(var(--color-highlight-rgb) / 0.95)"
								strokeLinecap="round"
								strokeWidth="8"
								strokeDasharray={readyCircumference}
								strokeDashoffset={readyStrokeOffset}
								className="transition-[stroke-dashoffset] duration-500 ease-out"
							/>
						</svg>
						<span className="absolute text-2xl font-extrabold text-text">{readyPercent}%</span>
					</div>
					<p className="text-lg font-medium text-text-muted sm:text-xl">
						{readyCount} / {nonHostPlayerCount} players ready
					</p>
				</div>

				<div className="grid w-full max-w-[31rem] grid-cols-1 gap-2">
					{setupItems.map((item) => {
						const Icon = item.icon;

						return (
							<div
								key={item.label}
								className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/30 px-3 py-2 text-left shadow-[inset_0_1px_0_rgb(255_255_255/0.035)]"
							>
								<span
									className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
										item.complete
											? "border-emerald-400/45 bg-emerald-500/15 text-emerald-200"
											: "border-border/70 bg-black/10 text-text-muted"
									}`}
								>
									<Icon className="h-3.5 w-3.5" aria-hidden="true" />
								</span>
								<span className="min-w-0">
									<span className="block text-sm font-semibold text-text">{item.label}</span>
									<span className="block text-xs text-text-muted">{item.value}</span>
								</span>
							</div>
						);
					})}
				</div>

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
