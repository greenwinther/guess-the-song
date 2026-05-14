"use client";

import clsx from "clsx";
import { FaBolt, FaCheck, FaClock, FaThumbsUp } from "react-icons/fa";

import type { Room } from "@/types/room";
import LobbyChecklist from "@/components/shared/lobby/LobbyChecklist";
import ReadinessProgress from "@/components/shared/lobby/ReadinessProgress";
import { CENTER_LOBBY_PANEL_CLASS } from "@/components/shared/layout/panelClassNames";

type PlayerLobbyCardProps = {
	hardcore: boolean;
	onHardcoreChange: (checked: boolean) => void;
	onReadyChange: (checked: boolean) => void;
	ready: boolean;
	room: Room;
};

export default function PlayerLobbyCard({
	hardcore,
	onHardcoreChange,
	onReadyChange,
	ready,
	room,
}: PlayerLobbyCardProps) {
	const nonHostPlayers = room.players.filter((player) => !player.isHost);
	const readyCount = nonHostPlayers.filter((player) => player.ready).length;
	const playerCount = nonHostPlayers.length;
	const hardcoreActive = room.hardcoreRequired || hardcore;
	const checklistItems = [
		{
			icon: FaBolt,
			label: "Mode",
			value: room.hardcoreRequired ? "Hardcore required" : hardcoreActive ? "Hardcore enabled" : "Normal mode",
			complete: true,
			completeIcon: FaCheck,
		},
		{
			icon: FaThumbsUp,
			label: "Ready status",
			value: ready ? "You are ready" : "Not ready yet",
			complete: ready,
			completeIcon: FaCheck,
		},
		{
			icon: FaClock,
			label: "Host",
			value: "Waiting to start",
			complete: false,
		},
	];

	return (
		<main className={CENTER_LOBBY_PANEL_CLASS}>
			<div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-14 text-center">
				<div className="flex flex-col items-center gap-5">
					<h2 className="w-full max-w-[31rem] whitespace-nowrap text-3xl font-extrabold leading-tight text-text sm:text-4xl">
						Welcome to the lobby
					</h2>
					<p className="max-w-md text-sm leading-relaxed text-text-muted sm:text-base">
						Stretch your ears. The playlist is warming up.
					</p>
				</div>

				<ReadinessProgress readyCount={readyCount} totalCount={playerCount} />
				<LobbyChecklist items={checklistItems} />

				<div className="grid w-full max-w-[31rem] grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)]">
					<button
						id="player-ready"
						type="button"
						aria-pressed={ready}
						onClick={() => onReadyChange(!ready)}
						className={clsx(
							"flex min-h-[5.25rem] items-center justify-center gap-3 rounded-xl border px-5 py-4 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-bg",
							ready
								? "border-emerald-400/55 bg-emerald-500/15 text-emerald-100 shadow-lg"
								: "btn-primary border-secondary/55 bg-gradient-to-r from-primary to-secondary text-[var(--color-on-primary)] shadow-lg hover:opacity-90"
						)}
					>
						<FaThumbsUp className="h-5 w-5 shrink-0" aria-hidden="true" />
						<span className="min-w-0">
							<span className="block text-base font-extrabold uppercase">Ready</span>
							<span className="mt-0.5 block text-xs opacity-80">
								{ready ? "You are marked ready" : "Tell the host you are set"}
							</span>
						</span>
					</button>

					<button
						id="player-hardcore"
						type="button"
						aria-pressed={hardcoreActive}
						disabled={room.hardcoreRequired}
						onClick={() => onHardcoreChange(!hardcore)}
						className={clsx(
							"flex min-h-[5.25rem] items-center justify-center gap-3 rounded-xl border px-4 py-3 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg",
							hardcoreActive
								? "border-amber-300/55 bg-amber-400/15 text-amber-100 shadow-lg"
								: "border-border/70 bg-card/25 text-text hover:bg-card/40",
							room.hardcoreRequired && "cursor-not-allowed opacity-75"
						)}
					>
						<FaBolt className="h-5 w-5 shrink-0" aria-hidden="true" />
						<span className="min-w-0">
							<span className="block text-base font-extrabold">Hardcore Mode</span>
							<span className="mt-0.5 block text-xs opacity-80">
								{room.hardcoreRequired
									? "Required by host"
									: hardcoreActive
										? "Higher stakes enabled"
										: "Optional challenge"}
							</span>
						</span>
					</button>
				</div>
			</div>
		</main>
	);
}
