// src/components/ui/PlayerList.tsx
"use client";

import { useState } from "react";
import { FaCheck, FaLock, FaQuestion } from "react-icons/fa6";
import type { Member } from "@/types/member";
import AvatarStack from "@/components/shared/AvatarStack";

interface PlayerListProps {
	players: Member[];
	submittedPlayers?: string[];
	className?: string;
	fallbackName?: string;
	lockedNames?: string[];
	lockedCounts?: Record<string, number>;
	solvedByTheme?: string[];
	lockedForThisRound?: string[];
	showLockCounts?: boolean;
	statusMode?: "game" | "lobby";
	inset?: boolean;
	onKick?: (player: Member) => void;
}

export default function RoomPlayerList({
	players,
	submittedPlayers = [],
	className,
	fallbackName,
	lockedNames = [],
	lockedCounts = {},
	solvedByTheme = [],
	lockedForThisRound = [],
	showLockCounts = true,
	statusMode = "game",
	inset = false,
	onKick,
}: PlayerListProps) {
	const lockedSet = new Set(lockedNames);
	const [actionForId, setActionForId] = useState<number | null>(null);
	const hasFallback =
		!!fallbackName && !players.some((p) => p.name.toLowerCase() === fallbackName.toLowerCase());
	const hasAvatar = (avatar?: Member["avatar"]) => Boolean(avatar?.base);
	return (
		<div className={`flex min-h-0 flex-col w-full ${className ?? ""}`}>
			<ul
				className={`scrollbar-hidden flex min-h-[12rem] flex-1 flex-col gap-1 max-h-64 overflow-y-auto sm:max-h-72 lg:max-h-[calc(100vh-27rem)] ${
					inset
						? "rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)]"
						: "pr-1"
				}`}
			>
				{hasFallback && (
					<li key="__fallback__" className="flex items-center gap-1.5 text-text">
						<span className="w-3 h-3 rounded-full bg-primary" />
						<span>{fallbackName}</span>
						<span className="ml-auto text-xs opacity-70 tabular-nums">0</span>
					</li>
				)}

				{players.map((p) => {
					const didSubmit = submittedPlayers.includes(p.name);
					const isLockedCurrentSong = lockedSet.has(p.name);
					const lockCount = lockedCounts[p.name] ?? 0;
					const showAvatar = hasAvatar(p.avatar);
					const statusTitle =
						statusMode === "lobby"
							? p.ready
								? "Ready"
								: "Not ready"
							: didSubmit
								? "Submitted"
								: "Not submitted";
					const dotClassName =
						statusMode === "lobby"
							? p.ready
								? "bg-emerald-400"
								: "bg-primary"
							: didSubmit
								? "bg-green-500"
								: "bg-primary";

					return (
						<li
							key={p.id}
							className="flex items-center gap-1.5 rounded-md px-1.5 text-text transition-colors hover:bg-black/10"
						>
							{/* Dot color follows lobby readiness or game submission status. */}
							{showAvatar ? (
								<AvatarStack
									avatar={p.avatar}
									size={48}
									className="h-12 w-12 shrink-0"
									title={statusTitle}
								/>
							) : (
								<span
									className={`w-3 h-3 rounded-full ${dotClassName}`}
									title={statusTitle}
								/>
							)}
							{onKick && !p.isHost ? (
								<button
									type="button"
									className="truncate text-left hover:underline"
									onClick={() => setActionForId((prev) => (prev === p.id ? null : p.id))}
									title="Player actions"
								>
									{p.name}
								</button>
							) : (
								<span className="truncate">{p.name}</span>
							)}
							{statusMode === "lobby" && p.ready && (
								<span
									className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10"
									title="Ready"
								>
									READY
								</span>
							)}

							{p.hardcore && (
								<span
									className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10"
									title="Hardcore mode"
								>
									HC
								</span>
							)}

							{/* Song lock */}
							{isLockedCurrentSong && (
								<span
									className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-secondary/35 bg-secondary/10 text-secondary"
									title="Locked current song"
									aria-label="Locked current song"
								>
									<FaLock className="h-2.5 w-2.5" aria-hidden="true" />
								</span>
							)}

							{/* THEME indicators */}
							{solvedByTheme.includes(p.name) && (
								<span
									title="Solved theme"
									aria-label="Solved theme"
									className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
								>
									<FaCheck className="h-2.5 w-2.5" aria-hidden="true" />
								</span>
							)}

							{!solvedByTheme.includes(p.name) && lockedForThisRound.includes(p.name) && (
								<span
									title="Guessed theme this round"
									aria-label="Guessed theme this round"
									className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary"
								>
									<FaQuestion className="h-2.5 w-2.5" aria-hidden="true" />
								</span>
							)}

							{/* Songs locked count */}
							{showLockCounts && (
								<span
									className="ml-auto text-xs opacity-70 tabular-nums"
									title="Songs locked"
								>
									{lockCount}
								</span>
							)}

							{onKick && !p.isHost && actionForId === p.id && (
								<button
									className="ml-2 text-xs uppercase tracking-widest text-red-300/90 hover:text-red-200"
									onClick={() => {
										setActionForId(null);
										onKick(p);
									}}
									title={`Kick ${p.name}`}
								>
									Kick
								</button>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
