"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";

import type { Room } from "@/types/room";

import { useReconnectNotice } from "@/hooks/shared/useReconnectNotice";
import { useRoomJoinSocket } from "@/hooks/shared/useRoomJoinSocket";
import { usePlayerJoinDenied } from "@/hooks/player/usePlayerJoinDenied";
import { usePlayerLobbySocket } from "@/hooks/player/usePlayerLobbySocket";
import BackgroundShell from "@/components/shared/BackgroundShell";
import RoomSidebar from "@/components/shared/RoomSidebar";
import PlayerJoinDeniedBanner from "@/components/player/common/PlayerJoinDeniedBanner";
import PlayerLobbyCard from "@/components/player/lobby/PlayerLobbyCard";
import PlayerPlaylistPanel from "@/components/player/game/playlist/PlayerPlaylistPanel";

export default function PlayerLobbyView({
	initialRoom,
	currentUserName,
}: {
	initialRoom: Room;
	currentUserName: string;
}) {
	const socket = useSocket();
	const router = useRouter();
	const { room } = useRoomState();
	const { submittedPlayers } = useGameRuntime();
	const { clearJoinDenied, joinDenied } = usePlayerJoinDenied({
		code: initialRoom.code,
		playerName: currentUserName,
		role: "player",
	});

	useRoomJoinSocket(initialRoom.code, currentUserName);
	usePlayerLobbySocket(initialRoom);

	const socketError = useReconnectNotice();

	const me = useMemo(
		() => room?.players.find((player) => player.name === currentUserName) || null,
		[room?.players, currentUserName]
	);
	const [hardcore, setHardcore] = useState<boolean>(!!me?.hardcore);
	const [ready, setReady] = useState<boolean>(!!me?.ready);

	useEffect(() => {
		setHardcore(!!me?.hardcore);
	}, [me?.hardcore]);

	useEffect(() => {
		setReady(!!me?.ready);
	}, [me?.ready]);

	useEffect(() => {
		if (!room || !joinDenied || joinDenied.reason === "kicked") return;
		const hasMe = room.players.some(
			(player) => player.name.toLowerCase() === currentUserName.toLowerCase()
		);
		if (hasMe) clearJoinDenied();
	}, [room, joinDenied, currentUserName, clearJoinDenied]);

	const handleHardcoreChange = (next: boolean) => {
		if (!room) return;
		setHardcore(next);
		socket.emit("PLAYER_HARDCORE", { code: room.code, hardcore: next }, (ok) => {
			if (!ok) {
				setHardcore(!!me?.hardcore);
				toast.error("Failed to update hardcore mode.");
			}
		});
	};

	const handleReadyChange = (next: boolean) => {
		if (!room) return;
		setReady(next);
		socket.emit("PLAYER_READY", { code: room.code, ready: next }, (ok) => {
			if (!ok) {
				setReady(!!me?.ready);
				toast.error("Failed to update ready status.");
			}
		});
	};

	const handleBackToStart = () => {
		clearJoinDenied();
		router.push("/");
	};

	if (!room) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-lg">Loading room...</p>
			</div>
		);
	}

	const nonHostPlayers = room.players.filter((player) => !player.isHost);
	const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every((player) => player.ready);

	return (
		<BackgroundShell
			bgImage={room.backgroundUrl ?? null}
			socketError={socketError}
			shellSize="lobby"
		>
			{joinDenied && (
				<PlayerJoinDeniedBanner joinDenied={joinDenied} onBackToStart={handleBackToStart} />
			)}

			<RoomSidebar
				roomCode={room.code}
				players={room.players}
				submittedPlayers={submittedPlayers}
				allPlayersReady={allReady}
				showGameplayLegend={false}
				showLockCounts={false}
				playerStatusMode="lobby"
			/>

			<PlayerLobbyCard
				hardcore={hardcore}
				onHardcoreChange={handleHardcoreChange}
				onReadyChange={handleReadyChange}
				ready={ready}
				room={room}
			/>

			<PlayerPlaylistPanel songs={room.songs} revealedIds={[]} variant="lobby" />
		</BackgroundShell>
	);
}
