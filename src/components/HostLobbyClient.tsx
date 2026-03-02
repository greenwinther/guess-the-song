"use client";

// src/components/HostLobbyClient.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactPlayer from "react-player";

import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";

import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import { useHostLobbySocket } from "@/hooks/host/useHostLobbySocket";

import BackgroundShell from "./ui/BackgroundShell";
import LeftSidebar from "./ui/LeftSidebar";
import SongSubmitForm from "./host/SongSubmitForm";
import Button from "./ui/Button";
import HostLobbyPlaylist from "./host/HostLobbyPlaylist";

import type { Room } from "@/types/room";
import { useThemeSockets } from "@/hooks/useThemeSockets";
import { HostThemeControls } from "./host/HostThemeControls";
import { HostDetailQuestionControls } from "./host/HostDetailQuestionControls";

export default function HostLobbyClient({ initialRoom }: { initialRoom: Room }) {
	const router = useRouter();
	const socket = useSocket();
	useThemeSockets();

	const { room: ctxRoom, setGameStarted, submittedPlayers } = useGame();

	// Host lobby socket wiring + initial room bootstrap
	useHostLobbySocket(initialRoom);

	// Reconnect banner + auto re-join as "Host"
	const socketError = useReconnectNotice();

	// 🔑 Use the prop immediately; context may still be null on the first paint
	const viewRoom = ctxRoom ?? initialRoom;
	const readyCount = viewRoom.players.filter((p) => p.ready).length;
	const nonHostPlayers = viewRoom.players.filter((p) => !p.isHost);
	const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.ready);

	// Local UI state
	const [previewUrl, setPreviewUrl] = useState<string>("");
	const [hardcoreRequired, setHardcoreRequired] = useState<boolean>(
		!!(viewRoom && viewRoom.hardcoreRequired)
	);
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

	useEffect(() => {
		setHardcoreRequired(!!viewRoom?.hardcoreRequired);
	}, [viewRoom?.hardcoreRequired]);

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
			setGameStarted(true);
			router.push(`/host/${viewRoom.code}/game`);
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

			{/* Center: theme controls + form + preview + start button */}
			<main className="lg:col-span-6 p-4 sm:p-6 pt-6 sm:pt-8 flex flex-col">
				<div>
					<div className="mb-4 sm:mb-6 flex items-start justify-between gap-3">
						<h2 className="text-xl sm:text-3xl font-semibold text-text">Song Setup</h2>
						<div className="flex flex-col items-end gap-2">
							<div className="flex items-center gap-2">
								<span className="text-sm text-text/80">Hardcore mode</span>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										id="hardcore-required"
										type="checkbox"
										className="sr-only peer"
										checked={hardcoreRequired}
										onChange={(e) => {
											const required = e.target.checked;
											setHardcoreRequired(required);
											socket.emit("HARDCORE_REQUIRED", { code: viewRoom.code, required }, (ok) => {
												if (!ok) {
													setHardcoreRequired(!!viewRoom?.hardcoreRequired);
													alert("Failed to update hardcore rule");
												}
											});
										}}
									/>
									<span className="w-10 h-6 bg-card/60 border border-border rounded-full peer-checked:bg-primary/50 peer-checked:border-primary/50 transition-colors" />
									<span className="absolute left-1 top-1 w-4 h-4 bg-white/80 rounded-full transition-transform peer-checked:translate-x-4" />
								</label>
							</div>
							<div className="flex items-center gap-2">
								<HostDetailQuestionControls />
								<HostThemeControls />
								<Button
									variant="secondary"
									size="md"
									onClick={() =>
										window.open(`/admin/${viewRoom.code}`, "_blank", "noopener,noreferrer")
									}
								>
									Admin view
								</Button>
							</div>
						</div>
					</div>
					<div className="w-full">
						<SongSubmitForm
							code={viewRoom.code}
							onUrlChange={setPreviewUrl}
							disabled={viewRoom.phase !== "LOBBY"}
						/>
					</div>

					<div className="w-full mt-6 sm:mt-8">
						<div className="rounded-lg overflow-hidden border border-border aspect-video">
							<ReactPlayer url={previewUrl} controls width="100%" height="100%" />
						</div>
					</div>
				</div>

				<div className="mt-6 sm:mt-8">
					<Button
						onClick={startGame}
						variant="primary"
						size="lg"
						className="w-full py-4 text-xl sm:text-2xl"
					>
						Start Game
					</Button>
				</div>
			</main>

			{/* Right: playlist with reveal/remove */}
			<HostLobbyPlaylist />

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




