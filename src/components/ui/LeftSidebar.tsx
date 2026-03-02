// src/components/ui/LeftSidebar.tsx
"use client";
import PlayerList from "./PlayerList";
import type { Member } from "@/types/member";
import toast from "react-hot-toast";

export default function LeftSidebar({
	roomCode,
	players,
	submittedPlayers = [],
	fallbackName,
	allPlayersReady,
	lockedNames, // 👈 NEW (optional)
	lockedCounts, // 👈 NEW
	solvedByTheme = [],
	lockedForThisRound = [],
	onKick,
}: {
	roomCode?: string;
	players: Member[];
	submittedPlayers?: string[];
	showHostBadge?: boolean;
	fallbackName?: string;
	allPlayersReady?: boolean;
	lockedNames?: string[]; // names locked for the *current* song
	lockedCounts?: Record<string, number>; // total songs locked per player
	solvedByTheme?: string[]; // who has solved the theme
	lockedForThisRound?: string[]; // who has locked in a guess for this round
	onKick?: (player: Member) => void;
}) {
	return (
		<aside className="order-1 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 pt-6 sm:pt-8 border-b lg:border-b-0 lg:border-r border-border flex flex-col items-center">
			<h1 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] leading-[1.15] pb-6 sm:pb-8">
				Guess the song
			</h1>

			<div className="bg-card/50 border border-border rounded-lg p-3 sm:p-4 text-center mb-4 sm:mb-6 w-full">
				<p className="text-text-muted text-xs sm:text-sm">Room code</p>
				<p
					className="text-3xl sm:text-4xl font-mono font-bold text-secondary cursor-pointer select-none"
					role="button"
					tabIndex={0}
					onClick={() => {
						if (!roomCode) return;
						if (navigator?.clipboard?.writeText) {
							navigator.clipboard.writeText(roomCode);
							toast.success("Room code copied.");
						}
					}}
					onKeyDown={(e) => {
						if (e.key !== "Enter" && e.key !== " ") return;
						e.preventDefault();
						if (!roomCode) return;
						if (navigator?.clipboard?.writeText) {
							navigator.clipboard.writeText(roomCode);
							toast.success("Room code copied.");
						}
					}}
					title="Click to copy"
				>
					{roomCode ?? "—"}
				</p>
			</div>

			<PlayerList
				players={players}
				submittedPlayers={submittedPlayers}
				className="w-full max-h-56 sm:max-h-72 lg:max-h-none overflow-y-auto"
				fallbackName={fallbackName}
				lockedNames={lockedNames}
				lockedCounts={lockedCounts}
				solvedByTheme={solvedByTheme}
				lockedForThisRound={lockedForThisRound}
				onKick={onKick}
			/>
			{allPlayersReady && (
				<div className="mt-3 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-center text-xs text-emerald-200">
					All players are ready
				</div>
			)}
			{players.length > 0 && (
				<div className="mt-auto w-full border-t border-border pt-3 text-xs text-text-muted leading-relaxed">
					<p className="flex items-center gap-1">
						LOCK <span>= Locked current song</span>
					</p>
					<p className="flex items-center gap-1">
						GUESS <span>= Guessed theme this round</span>
					</p>
					<p className="flex items-center gap-1">
						SOLVED <span>= Solved theme</span>
					</p>
				</div>
			)}
		</aside>
	);
}
