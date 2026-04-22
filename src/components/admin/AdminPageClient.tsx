"use client";

import { useSocketStatus } from "@/contexts/SocketContext";
import BackgroundShell from "@/components/shared/BackgroundShell";
import { useReconnectNotice } from "@/hooks/shared/useReconnectNotice";
import AdminStateNotice from "@/components/admin/common/AdminStateNotice";
import AdminPregameView from "@/components/admin/pregame/AdminPregameView";
import AdminGameView from "@/components/admin/game/AdminGameView";
import styles from "@/components/admin/admin.module.css";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import { useAdminHostAccess } from "@/hooks/admin/useAdminHostAccess";
import { useAdminSelectedHistoryPlayer } from "@/hooks/admin/useAdminSelectedHistoryPlayer";

export default function AdminPageClient({ roomCode }: { roomCode: string }) {
	const { status } = useSocketStatus();
	const socketError = useReconnectNotice();
	const code = String(roomCode || "").toUpperCase();
	const { access, room, setAccess } = useAdminHostAccess(code);
	const dashboard = useAdminDashboard({ code, access, onAccessChange: setAccess });
	const { selectedHistoryPlayer, selectedHistoryRows, setSelectedHistoryPlayer } =
		useAdminSelectedHistoryPlayer(dashboard);

	const reconnecting = status !== "connected";

	if (access === "unauthorized") {
		return <AdminStateNotice message="You do not have editor access for this room." />;
	}

	if (access === "not_found") {
		return <AdminStateNotice message="This room could not be found." />;
	}

	if (access === "checking" || !dashboard) {
		return <AdminStateNotice message="Loading room editor..." />;
	}

	const bgImage = room?.backgroundUrl ?? null;
	const inLobby = (room?.phase ?? dashboard.phase ?? "LOBBY") === "LOBBY";
	const currentSong = room?.songs.find((song) => song.id === dashboard.activeSongId) ?? null;

	return (
		<BackgroundShell
			bgImage={bgImage}
			socketError={socketError}
			variant="workspace"
			as="main"
			contentClassName={`${styles.workspace} gap-4 p-0`}
		>
			{inLobby ? (
				<AdminPregameView room={room} roomCode={dashboard.code} />
			) : (
				<AdminGameView
					dashboard={dashboard}
					reconnecting={reconnecting}
					currentSong={currentSong}
					selectedHistoryPlayer={selectedHistoryPlayer}
					selectedHistoryRows={selectedHistoryRows}
					onSelectHistoryPlayer={setSelectedHistoryPlayer}
				/>
			)}
		</BackgroundShell>
	);
}
