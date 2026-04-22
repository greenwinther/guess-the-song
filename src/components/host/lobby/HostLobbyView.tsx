"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import { useGameRuntime, useRoomState } from "@/contexts/gameContext";

import { useReconnectNotice } from "@/hooks/shared/useReconnectNotice";
import { useHostDebugVisibility } from "@/hooks/host/useHostDebugVisibility";
import { useHostLobbySocket } from "@/hooks/host/useHostLobbySocket";
import { useThemeSocketSync } from "@/hooks/shared/useThemeSocketSync";
import BackgroundShell from "@/components/shared/BackgroundShell";
import RoomSidebar from "@/components/shared/RoomSidebar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import HostPlaylistPanel from "@/components/host/common/HostPlaylistPanel";
import HostLobbyDebugPanel from "@/components/host/lobby/HostLobbyDebugPanel";
import HostStartGamePanel from "@/components/host/lobby/HostStartGamePanel";

import type { Member } from "@/types/member";
import type { Room } from "@/types/room";

export default function HostLobbyView({ initialRoom }: { initialRoom: Room }) {
	const socket = useSocket();
	const [playerToKick, setPlayerToKick] = useState<Member | null>(null);
	useThemeSocketSync();

	const { room: ctxRoom } = useRoomState();
	const { submittedPlayers } = useGameRuntime();

	useHostLobbySocket(initialRoom);
	const socketError = useReconnectNotice();
	const { showDebug } = useHostDebugVisibility({ enableKeyboardShortcut: true });

	const viewRoom = ctxRoom ?? initialRoom;
	const readyCount = viewRoom.players.filter((player) => player.ready).length;
	const nonHostPlayers = viewRoom.players.filter((player) => !player.isHost);
	const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every((player) => player.ready);
	const isDev = process.env.NODE_ENV !== "production";
	const confirmKick = () => {
		if (!playerToKick) return;
		const playerName = playerToKick.name;
		setPlayerToKick(null);
		socket.emit("kickPlayer", { code: viewRoom.code, playerName }, (success) => {
			if (!success) toast.error("Failed to kick player.");
		});
	};

	return (
		<BackgroundShell bgImage={viewRoom.backgroundUrl ?? null} socketError={socketError}>
			<RoomSidebar
				roomCode={viewRoom.code}
				players={viewRoom.players}
				submittedPlayers={submittedPlayers}
				fallbackName="Host"
				allPlayersReady={allReady && nonHostPlayers.length > 0}
				onKick={(player) => {
					setPlayerToKick(player);
				}}
			/>
			<ConfirmDialog
				open={Boolean(playerToKick)}
				title="Kick player?"
				description={
					playerToKick
						? `Remove ${playerToKick.name} from this room?`
						: "Remove this player from the room?"
				}
				confirmLabel="Kick"
				confirmVariant="danger"
				onConfirm={confirmKick}
				onCancel={() => setPlayerToKick(null)}
			/>

			<HostStartGamePanel
				allPlayersReady={allReady}
				nonHostPlayerCount={nonHostPlayers.length}
				room={viewRoom}
			/>

			<HostPlaylistPanel
				songs={viewRoom.songs}
				roomOverride={viewRoom}
				showRevealControls={false}
			/>

			{isDev && showDebug && (
				<HostLobbyDebugPanel
					nonHostPlayerCount={nonHostPlayers.length}
					readyCount={readyCount}
					room={viewRoom}
				/>
			)}
		</BackgroundShell>
	);
}
