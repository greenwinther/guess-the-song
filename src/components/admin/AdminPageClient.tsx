"use client";

import BackgroundShell from "@/components/shared/BackgroundShell";
import { useReconnectNotice } from "@/hooks/shared/useReconnectNotice";
import StatusNotice from "@/components/shared/StatusNotice";
import AdminPregameView from "@/components/admin/pregame/AdminPregameView";
import AdminGameView from "@/components/admin/game/AdminGameView";
import styles from "@/components/admin/admin.module.css";
import { useAdminDashboard } from "@/hooks/admin/useAdminDashboard";
import { useAdminHostAccess } from "@/hooks/admin/useAdminHostAccess";
import { useAdminSelectedHistoryPlayer } from "@/hooks/admin/useAdminSelectedHistoryPlayer";
import { getAccessStatusMessage } from "@/lib/accessStatus";
import { ROOM_SHELL_HEIGHT_CLASS } from "@/components/shared/layout/panelClassNames";

export default function AdminPageClient({ roomCode }: { roomCode: string }) {
	const socketError = useReconnectNotice();
	const code = String(roomCode || "").toUpperCase();
	const { access, room, setAccess, hostLink } = useAdminHostAccess(code);
	const dashboard = useAdminDashboard({ code, access, onAccessChange: setAccess });
	const { selectedHistoryPlayer, selectedHistoryRows, setSelectedHistoryPlayer } =
		useAdminSelectedHistoryPlayer(dashboard);

	const accessMessages = {
		checking: "Loading room editor...",
		unauthorized: "You do not have editor access for this room.",
		not_found: "This room could not be found.",
	} as const;

	if (access !== "authorized" || !dashboard) {
		const status = access === "authorized" ? "checking" : access;
		return (
			<StatusNotice
				message={getAccessStatusMessage(status, accessMessages)}
				fullScreen
				tone={status === "checking" ? "default" : "error"}
				className={styles.stateCard}
			/>
		);
	}

	const bgImage = room?.backgroundUrl ?? null;
	const inLobby = (room?.phase ?? dashboard.phase ?? "LOBBY") === "LOBBY";

	return (
		<BackgroundShell
			bgImage={bgImage}
			socketError={socketError}
			variant="workspace"
			as="main"
			contentClassName={`${styles.workspace} ${ROOM_SHELL_HEIGHT_CLASS} min-h-0 gap-4 p-0`}
		>
			{inLobby ? (
				<AdminPregameView room={room} roomCode={dashboard.code} hostLink={hostLink} />
			) : (
				<AdminGameView
					dashboard={dashboard}
					roomTheme={room?.theme ?? null}
					selectedHistoryPlayer={selectedHistoryPlayer}
					selectedHistoryRows={selectedHistoryRows}
					onSelectHistoryPlayer={setSelectedHistoryPlayer}
				/>
			)}
		</BackgroundShell>
	);
}
