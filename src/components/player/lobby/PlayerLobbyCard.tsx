"use client";

import clsx from "clsx";
import { FaBolt, FaCheck, FaClock, FaThumbsUp } from "react-icons/fa";

import type { Room } from "@/types/room";

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
	const readyPercent = playerCount > 0 ? Math.round((readyCount / playerCount) * 100) : 0;
	const hardcoreActive = room.hardcoreRequired || hardcore;
	const readyCircumference = 2 * Math.PI * 42;
	const readyStrokeOffset = readyCircumference * (1 - readyPercent / 100);
	const checklistItems = [
		{
			icon: FaBolt,
			label: "Mode",
			value: room.hardcoreRequired ? "Hardcore required" : hardcoreActive ? "Hardcore enabled" : "Normal mode",
			complete: true,
		},
		{
			icon: FaThumbsUp,
			label: "Ready status",
			value: ready ? "You are ready" : "Not ready yet",
			complete: ready,
		},
		{
			icon: FaClock,
			label: "Host",
			value: "Waiting to start",
			complete: false,
		},
	];

	return (
		<main className="order-2 relative flex min-h-[36rem] w-full flex-col justify-start p-5 pt-10 sm:p-7 sm:pt-14 lg:order-none lg:col-span-6">
			<div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-14 text-center">
				<div className="flex flex-col items-center gap-5">
					<h2 className="w-full max-w-[31rem] whitespace-nowrap text-3xl font-extrabold leading-tight text-text sm:text-4xl">
						Welcome to the lobby
					</h2>
					<p className="max-w-md text-sm leading-relaxed text-text-muted sm:text-base">
						Stretch your ears. The playlist is warming up.
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
						{readyCount} / {playerCount} players ready
					</p>
				</div>

				<div className="grid w-full max-w-[31rem] grid-cols-1 gap-2">
					{checklistItems.map((item) => {
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
									{item.complete ? (
										<FaCheck className="h-3.5 w-3.5" aria-hidden="true" />
									) : (
										<Icon className="h-3.5 w-3.5" aria-hidden="true" />
									)}
								</span>
								<span className="min-w-0">
									<span className="block text-sm font-semibold text-text">{item.label}</span>
									<span className="block text-xs text-text-muted">{item.value}</span>
								</span>
							</div>
						);
					})}
				</div>

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
