// src/components/PlayerList.tsx
"use client";

import { Player } from "@/types/room";

interface PlayerListProps {
	players: Player[];
	submittedPlayers?: string[];
	className?: string;
	fallbackName?: string;
	lockedNames?: string[];
	lockedCounts?: Record<string, number>;
	solvedByTheme?: string[];
	lockedForThisRound?: string[];
}

export default function PlayerList({
	players,
	submittedPlayers = [],
	className,
	fallbackName,
	lockedNames = [],
	lockedCounts = {},
	solvedByTheme = [],
	lockedForThisRound = [],
}: PlayerListProps) {
	const lockedSet = new Set(lockedNames);
	const hasFallback =
		!!fallbackName && !players.some((p) => p.name.toLowerCase() === fallbackName.toLowerCase());

	return (
		<div className={`flex flex-col w-full ${className ?? ""}`}>
			<ul className="space-y-2 flex-1">
				{hasFallback && (
					<li key="__fallback__" className="flex items-center gap-2 text-text">
						<span className="w-3 h-3 rounded-full bg-primary" />
						<span>{fallbackName}</span>
						<span className="ml-auto text-xs opacity-70 tabular-nums">0</span>
					</li>
				)}

				{players.map((p) => {
					const didSubmit = submittedPlayers.includes(p.name);
					const isLockedCurrentSong = lockedSet.has(p.name);
					const lockCount = lockedCounts[p.name] ?? 0;

					return (
						<li key={p.id} className="flex items-center gap-2 text-text">
							{/* Dot color = submitted status */}
							<span
								className={`w-3 h-3 rounded-full ${
									didSubmit ? "bg-green-500" : "bg-primary"
								}`}
								title={didSubmit ? "Submitted" : "Not submitted"}
							/>
							<span className="truncate">{p.name}</span>

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
									🔒
								</span>
							)}

							{/* THEME indicators */}
							{solvedByTheme.includes(p.name) && (
								<span title="Solved theme" aria-label="Solved theme" className="ml-1">
									✅
								</span>
							)}

							{!solvedByTheme.includes(p.name) && lockedForThisRound.includes(p.name) && (
								<span
									title="Guessed theme this round"
									aria-label="Guessed theme this round"
									className="ml-1"
								>
									⏳
								</span>
							)}

							{/* Songs locked count */}
							<span className="ml-auto text-xs opacity-70 tabular-nums" title="Songs locked">
								{lockCount}
							</span>
						</li>
					);
				})}
			</ul>

			{/* Legend (only if needed) */}
			{players.length > 0 && (
				<div className="mt-3 border-t border-border pt-2 text-xs text-text-muted leading-relaxed">
					<p className="flex items-center gap-1">
						🔒 <span>= Locked current song</span>
					</p>
					<p className="flex items-center gap-1">
						⏳ <span>= Guessed theme this round</span>
					</p>
					<p className="flex items-center gap-1">
						✅ <span>= Solved theme</span>
					</p>
				</div>
			)}
		</div>
	);
}
