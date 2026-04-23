// src/components/ui/LeftSidebar.tsx
"use client";
import { FaCheck, FaLock, FaQuestion } from "react-icons/fa6";
import RoomPlayerList from "./RoomPlayerList";
import type { Member } from "@/types/member";
import toast from "react-hot-toast";

export default function RoomSidebar({
	roomCode,
	players,
	submittedPlayers = [],
	fallbackName,
	allPlayersReady,
	lockedNames, // 👈 NEW (optional)
	lockedCounts, // 👈 NEW
	solvedByTheme = [],
	lockedForThisRound = [],
	showGameplayLegend = true,
	showLockCounts = true,
	playerStatusMode = "game",
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
	showGameplayLegend?: boolean;
	showLockCounts?: boolean;
	playerStatusMode?: "game" | "lobby";
	onKick?: (player: Member) => void;
}) {
	return (
		<aside className="order-1 lg:order-none w-full min-h-0 lg:col-span-3 p-4 sm:p-6 pt-6 sm:pt-8 border-b lg:border-b-0 lg:border-r border-border flex flex-col items-center">
			<h1 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] leading-[1.15] pb-6 sm:pb-8">
				Guess the song
			</h1>

			<div className="mb-4 w-full rounded-lg bg-black/15 p-3 text-center shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)] sm:mb-6 sm:p-4">
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

			<RoomPlayerList
				players={players}
				submittedPlayers={submittedPlayers}
				className="w-full flex-1 min-h-0"
				fallbackName={fallbackName}
				lockedNames={lockedNames}
				lockedCounts={lockedCounts}
				solvedByTheme={solvedByTheme}
				lockedForThisRound={lockedForThisRound}
				showLockCounts={showLockCounts}
				statusMode={playerStatusMode}
				inset
				onKick={onKick}
			/>
			{allPlayersReady && (
				<div className="mt-3 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-center text-xs text-emerald-200">
					All players are ready
				</div>
			)}
			{showGameplayLegend && players.length > 0 && (
				<div className="mt-auto grid w-full grid-cols-3 gap-2 pt-3 text-[10px] text-text-muted">
					<div
						className="flex flex-col items-center gap-1 rounded-md border border-border/45 bg-black/10 px-1.5 py-2 text-center"
						title="Locked current song"
					>
						<span
							className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-secondary/35 bg-secondary/10 text-secondary"
							aria-label="Locked current song"
						>
							<FaLock className="h-3 w-3" aria-hidden="true" />
						</span>
						<span>Locked</span>
					</div>
					<div
						className="flex flex-col items-center gap-1 rounded-md border border-border/45 bg-black/10 px-1.5 py-2 text-center"
						title="Guessed theme this round"
					>
						<span
							className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary"
							aria-label="Guessed theme this round"
						>
							<FaQuestion className="h-3 w-3" aria-hidden="true" />
						</span>
						<span>Theme guess</span>
					</div>
					<div
						className="flex flex-col items-center gap-1 rounded-md border border-border/45 bg-black/10 px-1.5 py-2 text-center"
						title="Solved theme"
					>
						<span
							className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
							aria-label="Solved theme"
						>
							<FaCheck className="h-3 w-3" aria-hidden="true" />
						</span>
						<span>Solved</span>
					</div>
				</div>
			)}
		</aside>
	);
}
