"use client";

// src/components/HostControlLobbyView.tsx

import { useEffect, useState } from "react";

import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";

import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import { useHostLobbySocket } from "@/hooks/control/useHostLobbySocket";
import { useThemeSockets } from "@/hooks/useThemeSockets";

import BackgroundShell from "./ui/BackgroundShell";
import LeftSidebar from "./ui/LeftSidebar";
import Button from "./ui/Button";
import SetupPlaylistPanel from "./control/SetupPlaylistPanel";

import type { Room } from "@/types/room";

export default function HostControlLobbyView({ initialRoom }: { initialRoom: Room }) {
	const socket = useSocket();
	useThemeSockets();

	const { room: ctxRoom } = useRoomState();
	const { submittedPlayers, theme } = useGameRuntime();

	// Host lobby socket wiring + initial room bootstrap
	useHostLobbySocket(initialRoom);

	// Reconnect banner + auto re-join as "Host"
	const socketError = useReconnectNotice();

	// 🔑 Use the prop immediately; context may still be null on the first paint
	const viewRoom = ctxRoom ?? initialRoom;
	const effectiveTheme = (theme || viewRoom.theme || "").trim();
	const readyCount = viewRoom.players.filter((p) => p.ready).length;
	const nonHostPlayers = viewRoom.players.filter((p) => !p.isHost);
	const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.ready);

	const [showDebug, setShowDebug] = useState<boolean>(() => {
		if (typeof window === "undefined") return true;
		return localStorage.getItem("gts_debug_panel") !== "0";
	});
	const isDev = process.env.NODE_ENV !== "production";

	useEffect(() => {
		localStorage.setItem("gts_debug_panel", showDebug ? "1" : "0");
	}, [showDebug]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (!t) return;
			if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
			if (e.code === "KeyD") setShowDebug((prev) => !prev);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	// Start
	const startGame = () => {
		if (!viewRoom) return;
		if (viewRoom.songs.length === 0) {
			alert("Add at least one song before starting.");
			return;
		}
		if (nonHostPlayers.length > 0 && !allReady) {
			const ok = window.confirm("Not all players are ready. Start anyway?");
			if (!ok) return;
		}
		socket.emit("startGame", { code: viewRoom.code }, (ok: boolean) => {
			if (!ok) return alert("Could not start game");
		});
	};

	return (
		<BackgroundShell bgImage={viewRoom.backgroundUrl ?? null} socketError={socketError}>
			{/* Left sidebar: title, room code, players */}
			<LeftSidebar
				roomCode={viewRoom.code}
				players={viewRoom.players}
				submittedPlayers={submittedPlayers}
				fallbackName="Host"
				allPlayersReady={allReady && nonHostPlayers.length > 0}
				onKick={(player) => {
					const ok = window.confirm(`Kick ${player.name}?`);
					if (!ok) return;
					socket.emit("kickPlayer", { code: viewRoom.code, playerName: player.name }, (success) => {
						if (!success) alert("Failed to kick player");
					});
				}}
			/>

			{/* Center: live host control */}
			<main className="lg:col-span-6 flex items-center justify-center p-4 sm:p-6 pt-6 sm:pt-8">
				<Button
					onClick={startGame}
					variant="primary"
					size="lg"
					className="w-full max-w-md py-4 text-xl sm:text-2xl"
				>
					Start Game
				</Button>
			</main>

			{/* Right: read-only playlist summary */}
			<SetupPlaylistPanel roomOverride={viewRoom} allowRemoval={false} showDevTools={false} />

			{isDev && showDebug && (
				<div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-border bg-card/90 p-3 text-xs text-text shadow-xl backdrop-blur">
					<div className="mb-2 text-[10px] uppercase tracking-widest text-text/60">Debug</div>
					<div>Room: {viewRoom.code}</div>
					<div>Phase: {viewRoom.phase ?? "LOBBY"}</div>
					<div>Players: {viewRoom.players.length}</div>
					<div>Ready: {readyCount}/{nonHostPlayers.length}</div>
					<div>Songs: {viewRoom.songs.length}</div>
					<div className="mt-2 text-[10px] text-text/60">Press D to toggle</div>
				</div>
			)}
		</BackgroundShell>
	);
}




