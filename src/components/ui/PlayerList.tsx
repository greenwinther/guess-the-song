// src/components/PlayerList.tsx
"use client";

import { Player } from "@/types/room";

interface PlayerListProps {
	players: Player[];
	submittedPlayers?: string[]; // who pressed "Submit all guesses"
	className?: string;
	fallbackName?: string;
	lockedNames?: string[]; // who is locked for the *current* song (optional)
	lockedCounts?: Record<string, number>; // how many songs each player has locked (new)
}

export default function PlayerList({
	players,
	submittedPlayers = [],
	className,
	fallbackName,
	lockedNames = [],
	lockedCounts = {}, // default to empty
}: PlayerListProps) {
	const lockedSet = new Set(lockedNames);
	const hasFallback =
		!!fallbackName && !players.some((p) => p.name.toLowerCase() === fallbackName.toLowerCase());

	return (
		<ul className={`space-y-2 w-full ${className ?? ""}`}>
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
						{/* Dot color = submitted status (green if submitted, purple otherwise) */}
						<span
							className={`w-3 h-3 rounded-full ${didSubmit ? "bg-green-500" : "bg-primary"}`}
							title={didSubmit ? "Submitted" : "Not submitted"}
						/>
						<span className="truncate">{p.name}</span>

						{p.hardcore && (
							<span
								className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10"
								title="Hardcore"
							>
								HC
							</span>
						)}

						{/* Optional lock icon for the *current* song only */}
						{isLockedCurrentSong && (
							<span className="text-xs opacity-70" title="Locked">
								🔒
							</span>
						)}

						{/* Right-aligned: how many songs this player has locked in total */}
						<span className="ml-auto text-xs opacity-70 tabular-nums" title="Songs locked">
							{lockCount}
						</span>
					</li>
				);
			})}
		</ul>
	);
}
