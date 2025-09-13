"use client";

// src/components/HostLobbyClient.tsx

import { useState } from "react";
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
import HostPlaylistPanel from "./host/HostPlaylistPanel";

import type { Room } from "@/types/room";

export default function HostLobbyClient({ initialRoom }: { initialRoom: Room }) {
	const router = useRouter();
	const socket = useSocket();

	const { room, setGameStarted, submittedPlayers } = useGame();

	// Host lobby socket wiring + initial room bootstrap
	useHostLobbySocket(initialRoom);

	// Reconnect banner + auto re-join as "Host"
	const socketError = useReconnectNotice(initialRoom.code, "Host");

	// Local UI state
	const [previewUrl, setPreviewUrl] = useState<string>("");

	// Start
	const startGame = () => {
		if (!room) return;
		socket.emit("startGame", { code: room.code }, (ok: boolean) => {
			if (!ok) return alert("Could not start game");
			setGameStarted(true);
			router.push(`/host/${room.code}/game`);
		});
	};

	if (!room) return <p>Loading lobby…</p>;

	return (
		<BackgroundShell bgImage={room.backgroundUrl ?? null} socketError={socketError}>
			{/* Left sidebar: title, room code, players */}
			<LeftSidebar roomCode={room.code} players={room.players} submittedPlayers={submittedPlayers} />

			{/* Center: form + preview + start button */}
			<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col">
				<div>
					<h2 className="text-xl sm:text-3xl font-semibold text-text mb-4 sm:mb-6">Song Setup</h2>

					<div className="w-full">
						<SongSubmitForm code={room.code} onUrlChange={setPreviewUrl} />
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
			<HostPlaylistPanel />
		</BackgroundShell>
	);
}
