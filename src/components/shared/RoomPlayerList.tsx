// src/components/ui/PlayerList.tsx
"use client";

import { useState } from "react";
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
	onKick,
}: PlayerListProps) {
	const lockedSet = new Set(lockedNames);
	const [actionForId, setActionForId] = useState<number | null>(null);
	const hasFallback =
		!!fallbackName && !players.some((p) => p.name.toLowerCase() === fallbackName.toLowerCase());
	const hasAvatar = (avatar?: Member["avatar"]) => Boolean(avatar?.base);
	return (
		<div className={`flex flex-col w-full ${className ?? ""}`}>
			<ul className="space-y-1 flex-1 max-h-[26rem] overflow-y-auto pr-1">
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

					return (
						<li key={p.id} className="flex items-center gap-1.5 text-text">
							{/* Dot color = submitted status */}
							{showAvatar ? (
								<div
									className="relative w-12 h-12 rounded-full bg-card/30"
									title={didSubmit ? "Submitted" : "Not submitted"}
								>
									<AvatarStack avatar={p.avatar} size={48} className="relative h-12 w-12" />
								</div>
							) : (
								<span
									className={`w-3 h-3 rounded-full ${
										didSubmit ? "bg-green-500" : "bg-primary"
									}`}
									title={didSubmit ? "Submitted" : "Not submitted"}
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
							{p.ready && (
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
								<span className="text-xs opacity-70" title="Locked current song">
									LOCK
								</span>
							)}

							{/* THEME indicators */}
							{solvedByTheme.includes(p.name) && (
								<span title="Solved theme" aria-label="Solved theme" className="ml-1">
									SOLVED
								</span>
							)}

							{!solvedByTheme.includes(p.name) && lockedForThisRound.includes(p.name) && (
								<span
									title="Guessed theme this round"
									aria-label="Guessed theme this round"
									className="ml-1"
								>
									GUESS
								</span>
							)}

							{/* Songs locked count */}
							<span className="ml-auto text-xs opacity-70 tabular-nums" title="Songs locked">
								{lockCount}
							</span>

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
