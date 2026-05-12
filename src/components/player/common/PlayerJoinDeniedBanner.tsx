"use client";

import type { PlayerJoinDenied } from "@/hooks/player/usePlayerJoinDenied";

type PlayerJoinDeniedBannerProps = {
	joinDenied: PlayerJoinDenied;
	onBackToStart: () => void;
};

export default function PlayerJoinDeniedBanner({
	joinDenied,
	onBackToStart,
}: PlayerJoinDeniedBannerProps) {
	return (
		<div className="fixed left-0 top-12 z-50 w-full bg-red-500/90 py-2 text-center text-white">
			{joinDenied.reason === "kicked" && "You were kicked from this room."}
			{joinDenied.reason === "closed" && "This room is closed."}
			{joinDenied.reason === "not_found" && "Room not found."}
			{joinDenied.reason === "name_taken" && "That name is already taken in this room."}
			{joinDenied.reason === "unauthorized" && "You are not authorized for this player/host slot."}
			{joinDenied.reason === "error" && "Unable to join room."}
			<button className="ml-3 underline" onClick={onBackToStart}>
				Back to start
			</button>
		</div>
	);
}
