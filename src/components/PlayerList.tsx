// src/components/PlayerList.tsx
"use client";

import { Player } from "@/types/room";

interface PlayerListProps {
	players: Player[];
	submittedPlayers?: string[]; // Optional: useful in Guess phase
	className?: string;
}

export default function PlayerList({ players, submittedPlayers = [], className }: PlayerListProps) {
	return (
		<ul className={`space-y-2 w-full ${className ?? ""}`}>
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
