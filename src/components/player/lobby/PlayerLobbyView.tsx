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
import Button from "@/components/shared/Button";
import MobileSideDrawer from "@/components/shared/MobileSideDrawer";
import RoomSidebar from "@/components/shared/RoomSidebar";
import StatusNotice from "@/components/shared/StatusNotice";
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
	const [drawer, setDrawer] = useState<"players" | "playlist" | null>(null);

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
		return <StatusNotice message="Loading room..." />;
	}

	const shellHeightClassName =
		"h-auto min-h-[calc(100vh-2rem)] overflow-x-hidden overflow-y-auto sm:min-h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] lg:min-h-0 lg:overflow-hidden";

	return (
		<BackgroundShell
			bgImage={room.backgroundUrl ?? null}
			socketError={socketError}
			shellSize="lobby"
			contentClassName={shellHeightClassName}
		>
			{joinDenied && (
				<PlayerJoinDeniedBanner joinDenied={joinDenied} onBackToStart={handleBackToStart} />
			)}

			<RoomSidebar
				roomCode={room.code}
				players={room.players}
				submittedPlayers={submittedPlayers}
				fallbackName="Host"
				className="order-2 !hidden lg:!flex lg:order-1 lg:!h-full"
			/>

			<PlayerLobbyCard
				hardcore={hardcore}
				onHardcoreChange={handleHardcoreChange}
				onReadyChange={handleReadyChange}
				ready={ready}
				room={room}
				mobileActions={
					<div className="mt-14 flex w-full max-w-[31rem] gap-2 sm:mt-0 lg:hidden">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="flex-1"
							onClick={() => setDrawer("players")}
						>
							Players
						</Button>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="flex-1"
							onClick={() => setDrawer("playlist")}
						>
							Playlist
						</Button>
					</div>
				}
			/>

			<PlayerPlaylistPanel
				songs={room.songs}
				revealedIds={[]}
				variant="lobby"
				className="order-3 !hidden lg:!flex lg:order-3 lg:!h-full"
			/>

			<MobileSideDrawer
				open={drawer === "players"}
				title="Players"
				side="left"
				onClose={() => setDrawer(null)}
			>
				<RoomSidebar
					roomCode={room.code}
					players={room.players}
					submittedPlayers={submittedPlayers}
					fallbackName="Host"
					className="!h-full !border-0 !p-4 !pt-4"
				/>
			</MobileSideDrawer>
			<MobileSideDrawer
				open={drawer === "playlist"}
				title="Playlist"
				side="right"
				onClose={() => setDrawer(null)}
			>
				<PlayerPlaylistPanel
					songs={room.songs}
					revealedIds={[]}
					variant="lobby"
					className="!h-full !border-0 !p-4 !pt-4"
				/>
			</MobileSideDrawer>
		</BackgroundShell>
	);
}
