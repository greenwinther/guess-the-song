"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket, useSocketStatus } from "@/contexts/SocketContext";
import type { AdminDashboardPayload } from "@/types/socket";
import type { Room } from "@/types/room";
import AdminCurrentRoundPanel from "@/components/admin/components/AdminCurrentRoundPanel";
import AdminGuessHistoryPanel from "@/components/admin/components/AdminGuessHistoryPanel";
import AdminRoomHeader from "@/components/admin/components/AdminRoomHeader";
import BackgroundShell from "@/components/shared/BackgroundShell";
import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import AdminStateNotice from "@/components/admin/components/AdminStateNotice";
import type { AvatarConfig } from "@/types/avatar";
import AdminThemeStatusPanel from "@/components/admin/components/AdminThemeStatusPanel";
import type { Submission } from "@/types/submission";
import AdminSetupPanel from "@/components/admin/setup/AdminSetupPanel";
import AdminHomeLink from "@/components/admin/components/AdminHomeLink";
import Button from "@/components/shared/Button";
import styles from "@/components/admin/admin.module.css";

type AccessState = "checking" | "authorized" | "unauthorized" | "not_found";

const getClientId = () => {
	const key = "gts-client-id";
	let value = localStorage.getItem(key);
	if (!value) {
		value = crypto.randomUUID();
		localStorage.setItem(key, value);
	}
	return value;
};

const getStoredAvatar = (): AvatarConfig | null => {
	try {
		const raw = localStorage.getItem("gts-avatar-v2");
		if (!raw) return null;
		const parsed = JSON.parse(raw) as AvatarConfig;
		return parsed?.base ? parsed : null;
	} catch {
		return null;
	}
};

const hostKey = (code: string) => `gts-host-room-${code}`;

export default function AdminViewClient({ roomCode }: { roomCode: string }) {
	const socket = useSocket();
	const { status } = useSocketStatus();
	const socketError = useReconnectNotice();
	const code = String(roomCode || "").toUpperCase();

	const [hostName, setHostName] = useState("Host");
	const [room, setRoom] = useState<Room | null>(null);
	const [dashboard, setDashboard] = useState<AdminDashboardPayload | null>(null);
	const [access, setAccess] = useState<AccessState>("checking");
	const [canJoinAsHost, setCanJoinAsHost] = useState(false);
	const [selectedHistoryPlayer, setSelectedHistoryPlayer] = useState<string | null>(null);
	const joinDeniedRef = useRef<null | "kicked" | "closed" | "not_found" | "error">(null);

	useEffect(() => {
		setDashboard(null);
		setRoom(null);
		setAccess("checking");
		setCanJoinAsHost(false);
		setSelectedHistoryPlayer(null);
		joinDeniedRef.current = null;
		try {
			const raw = localStorage.getItem(hostKey(code));
			if (!raw) {
				setAccess("unauthorized");
				return;
			}
			const parsed = JSON.parse(raw) as { name?: string };
			setHostName(parsed?.name?.trim() || "Host");
			setCanJoinAsHost(true);
		} catch {
			setAccess("unauthorized");
		}
	}, [code]);

	useEffect(() => {
		if (!socket || !canJoinAsHost || access === "unauthorized") return;

		const onRoomData = (nextRoom: Room) => {
			setRoom(nextRoom);
			const me = nextRoom.players.find((player) => player.name === hostName);
			if (!me?.isHost) {
				setAccess("unauthorized");
				return;
			}
			setAccess("authorized");
		};
		const onSongAdded = (song: Submission) => {
			setRoom((prev) => (!prev ? prev : { ...prev, songs: [...prev.songs, song] }));
		};
		const onSongRemoved = ({ songId }: { songId: number }) => {
			setRoom((prev) =>
				!prev ? prev : { ...prev, songs: prev.songs.filter((song) => song.id !== songId) }
			);
		};
		const onThemeUpdated = ({ theme }: { theme?: string }) => {
			setRoom((prev) => (!prev ? prev : { ...prev, theme: theme ?? "" }));
		};
		const onGameStarted = (nextRoom: Room) => {
			setRoom(nextRoom);
			setAccess("authorized");
		};

		const onJoinDenied = ({ reason }: { reason: "kicked" | "closed" | "not_found" | "error" }) => {
			joinDeniedRef.current = reason;
			if (reason === "not_found" || reason === "closed") {
				setAccess("not_found");
				return;
			}
			setAccess("unauthorized");
		};

		const doJoin = () => {
			const avatar = getStoredAvatar();
			socket.emit(
				"joinRoom",
				{ code, name: hostName, clientId: getClientId(), avatar: avatar ?? undefined },
				(ok: boolean) => {
					if (!ok && !joinDeniedRef.current) {
						setAccess("not_found");
					}
				}
			);
		};

		socket.on("roomData", onRoomData);
		socket.on("songAdded", onSongAdded);
		socket.on("songRemoved", onSongRemoved);
		socket.on("THEME_UPDATED", onThemeUpdated);
		socket.on("gameStarted", onGameStarted);
		socket.on("joinDenied", onJoinDenied);
		if (socket.connected) doJoin();
		socket.on("connect", doJoin);

		return () => {
			socket.off("roomData", onRoomData);
			socket.off("songAdded", onSongAdded);
			socket.off("songRemoved", onSongRemoved);
			socket.off("THEME_UPDATED", onThemeUpdated);
			socket.off("gameStarted", onGameStarted);
			socket.off("joinDenied", onJoinDenied);
			socket.off("connect", doJoin);
		};
	}, [socket, code, hostName, canJoinAsHost, access]);

	const requestDashboard = useCallback(() => {
		if (!socket || access !== "authorized") return;
		socket.emit("ADMIN_GET_DASHBOARD", { code }, (res) => {
			if (!res.ok) {
				if (res.error === "ROOM_NOT_FOUND") {
					setAccess("not_found");
					return;
				}
				if (res.error === "NOT_AUTHORIZED") {
					setAccess("unauthorized");
					return;
				}
				return;
			}
			setDashboard(res.dashboard);
		});
	}, [socket, access, code]);

	useEffect(() => {
		if (!socket || access !== "authorized") return;

		requestDashboard();

		const onPush = ({ dashboard: next }: { dashboard: AdminDashboardPayload }) => {
			setDashboard(next);
		};
		const refresh = () => requestDashboard();

		socket.on("ADMIN_DASHBOARD", onPush);
		socket.on("roomData", refresh);
		socket.on("songChanged", refresh);
		socket.on("playerGuessLocked", refresh);
		socket.on("playerGuessUndo", refresh);
		socket.on("detailLockSnapshot", refresh);
		socket.on("detailFinalized", refresh);
		socket.on("THEME_SOLVED", refresh);
		socket.on("THEME_GUESSED_THIS_ROUND", refresh);
		socket.on("THEME_REVEALED", refresh);
		socket.on("THEME_HINT_READY", refresh);
		socket.on("gameStarted", refresh);
		socket.on("gameOver", refresh);
		socket.on("songAdded", refresh);
		socket.on("songRemoved", refresh);
		socket.on("THEME_UPDATED", refresh);

		const interval = window.setInterval(requestDashboard, 5000);

		return () => {
			window.clearInterval(interval);
			socket.off("ADMIN_DASHBOARD", onPush);
			socket.off("roomData", refresh);
			socket.off("songChanged", refresh);
			socket.off("playerGuessLocked", refresh);
			socket.off("playerGuessUndo", refresh);
			socket.off("detailLockSnapshot", refresh);
			socket.off("detailFinalized", refresh);
			socket.off("THEME_SOLVED", refresh);
			socket.off("THEME_GUESSED_THIS_ROUND", refresh);
			socket.off("THEME_REVEALED", refresh);
			socket.off("THEME_HINT_READY", refresh);
			socket.off("gameStarted", refresh);
			socket.off("gameOver", refresh);
			socket.off("songAdded", refresh);
			socket.off("songRemoved", refresh);
			socket.off("THEME_UPDATED", refresh);
		};
	}, [socket, access, requestDashboard]);

	useEffect(() => {
		if (!dashboard) return;
		const names = dashboard.currentSongRows.map((row) => row.playerName);
		if (names.length === 0) {
			if (selectedHistoryPlayer !== null) setSelectedHistoryPlayer(null);
			return;
		}
		if (!selectedHistoryPlayer || !names.includes(selectedHistoryPlayer)) {
			setSelectedHistoryPlayer(names[0]);
		}
	}, [dashboard, selectedHistoryPlayer]);

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
	const playerHistories = Array.isArray(dashboard.playerHistories) ? dashboard.playerHistories : [];
	const historyByPlayer = new Map(playerHistories.map((entry) => [entry.playerName, entry.rounds]));
	const selectedHistoryRows = selectedHistoryPlayer ? historyByPlayer.get(selectedHistoryPlayer) ?? [] : [];

	return (
		<BackgroundShell
			bgImage={bgImage}
			socketError={socketError}
			variant="workspace"
			as="main"
			contentClassName={`${styles.workspace} gap-4 p-0`}
		>
			{inLobby ? (
				<AdminSetupPanel room={room} roomCode={dashboard.code} />
			) : (
				<div className="flex flex-col gap-4">
					<header
						className={`${styles.panel} ${styles.panelOpen} ${styles.panelPrimary} z-20 grid items-center gap-4 rounded-b-2xl border border-border/70 border-t-0 p-4 md:grid-cols-[1fr_auto_1fr]`}
					>
						<div />
						<AdminHomeLink className="justify-self-start text-center md:justify-self-center" />
						<div className="self-end justify-self-end">
							<Button
								variant="secondary"
								size="sm"
								className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
								onClick={() => window.open(`/control/${dashboard.code}`, "_blank", "noopener,noreferrer")}
							>
								Open host control
							</Button>
						</div>
					</header>

					<div className="grid gap-4 xl:grid-cols-2">
						<section
							className={`${styles.panel} ${styles.panelPrimary} rounded-2xl border border-border/70 p-4 backdrop-blur-xl`}
						>
							<div className="flex min-w-0 flex-col gap-4">
								<AdminRoomHeader
									dashboard={dashboard}
									reconnecting={reconnecting}
									currentSongSubmitter={currentSong?.submitter ?? null}
									currentSongDetailAnswer={currentSong?.detailAnswer ?? null}
									embedded
								/>
								<AdminCurrentRoundPanel
									dashboard={dashboard}
									selectedHistoryPlayer={selectedHistoryPlayer}
									onSelectHistoryPlayer={setSelectedHistoryPlayer}
									embedded
								/>
								{dashboard.theme.enabled && (
									<AdminThemeStatusPanel dashboard={dashboard} embedded />
								)}
							</div>
						</section>

						<AdminGuessHistoryPanel
							dashboard={dashboard}
							selectedHistoryPlayer={selectedHistoryPlayer}
							rows={selectedHistoryRows}
						/>
					</div>
				</div>
			)}
		</BackgroundShell>
	);
}
