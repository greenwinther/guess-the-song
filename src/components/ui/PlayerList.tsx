// src/components/PlayerList.tsx
"use client";

import { Player } from "@/types/room";

interface PlayerListProps {
	players: Player[];
	submittedPlayers?: string[];
	className?: string;
	/** If provided, render a first row with this name ONLY when it's missing from players */
	fallbackName?: string;
}

export default function PlayerList({
	players,
	submittedPlayers = [],
	className,
	fallbackName,
}: PlayerListProps) {
	const hasFallback =
		!!fallbackName && !players.some((p) => p.name.toLowerCase() === fallbackName.toLowerCase());

	return (
		<ul className={`space-y-2 w-full ${className ?? ""}`}>
			{hasFallback && (
				<li key="__fallback__" className="flex items-center space-x-2 text-text">
					<span className="w-3 h-3 rounded-full bg-primary" />
					<span>{fallbackName}</span>
				</li>
			)}

			{players.map((p) => {
				const didSubmit = submittedPlayers.includes(p.name);
				return (
					<li key={p.id} className="flex items-center space-x-2 text-text">
						<span
							className={`w-3 h-3 rounded-full ${didSubmit ? "bg-green-500" : "bg-primary"}`}
						/>
						<span>{p.name}</span>
					</li>
				);
			})}
		</ul>
	);
}
