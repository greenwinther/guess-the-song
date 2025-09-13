// src/components/join/LeftSidebar.tsx
import PlayerList from "@/components/ui/PlayerList";
import type { Player } from "@/types/room";

export default function LeftSidebar({
	roomCode,
	players,
	submittedPlayers,
}: {
	roomCode?: string;
	players: Player[];
	submittedPlayers: string[];
}) {
	return (
		<aside className="order-1 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-border flex flex-col items-center">
			<h1 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] leading-[1.15] pb-6 sm:pb-8">
				Guess the song
			</h1>

			<div className="bg-card/50 border border-border rounded-lg p-3 sm:p-4 text-center mb-4 sm:mb-6 w-full">
				<p className="text-text-muted text-xs sm:text-sm">Room code</p>
				<p className="text-3xl sm:text-4xl font-mono font-bold text-secondary">
					{roomCode ?? "Loading…"}
				</p>
			</div>

			<div className="w-full max-h-56 sm:max-h-72 lg:max-h-none overflow-y-auto">
				<PlayerList players={players} submittedPlayers={submittedPlayers} className="w-full" />
			</div>
		</aside>
	);
}
