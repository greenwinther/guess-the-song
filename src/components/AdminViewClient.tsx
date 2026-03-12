"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket, useSocketStatus } from "@/contexts/SocketContext";
import type { AdminDashboardPayload } from "@/types/socket";
import type { Room } from "@/types/room";
import BackgroundShell from "@/components/ui/BackgroundShell";
import { useReconnectNotice } from "@/hooks/useReconnectNotice";
import type { AvatarConfig } from "@/types/avatar";
import { getYouTubeID } from "@/lib/youtube";
import type { Submission } from "@/types/submission";
import AdminSetupPanel from "@/components/admin/AdminSetupPanel";

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
		return (
			<main className="min-h-screen grid place-items-center bg-gradient-to-br from-bg to-secondary p-6">
				<div className="rounded-xl border border-border bg-card/70 p-6 text-text">
					You do not have editor access for this room.
				</div>
			</main>
		);
	}

	if (access === "not_found") {
		return (
			<main className="min-h-screen grid place-items-center bg-gradient-to-br from-bg to-secondary p-6">
				<div className="rounded-xl border border-border bg-card/70 p-6 text-text">
					This room could not be found.
				</div>
			</main>
		);
	}

	if (access === "checking" || !dashboard) {
		return (
			<main className="min-h-screen grid place-items-center bg-gradient-to-br from-bg to-secondary p-6">
				<div className="rounded-xl border border-border bg-card/70 p-6 text-text">
					Loading room editor...
				</div>
			</main>
		);
	}

	const bgImage = (() => {
		if (!room || dashboard.activeSongId == null) return room?.backgroundUrl ?? null;
		const song = room.songs.find((item) => item.id === dashboard.activeSongId);
		const videoId = getYouTubeID(song?.url ?? "");
		if (!videoId) return room.backgroundUrl ?? null;
		return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
	})();
	const currentSong = room?.songs.find((song) => song.id === dashboard.activeSongId) ?? null;
	const lockedCount = dashboard.currentSongRows.filter((row) => row.locked).length;
	const totalGuessers = dashboard.currentSongRows.length;
	const detailLockedCount = dashboard.currentSongRows.filter((row) => row.detailLocked).length;
	const playerHistories = Array.isArray(dashboard.playerHistories) ? dashboard.playerHistories : [];
	const historyByPlayer = new Map(playerHistories.map((entry) => [entry.playerName, entry.rounds]));
	const selectedHistoryRows = selectedHistoryPlayer ? historyByPlayer.get(selectedHistoryPlayer) ?? [] : [];

	return (
		<BackgroundShell bgImage={bgImage} socketError={socketError}>
			<main className="w-full p-4 sm:p-6 space-y-4 lg:col-span-12">
				<AdminSetupPanel room={room} roomCode={dashboard.code} />

				<header className="rounded-xl border border-border bg-card/40 p-4">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-xl font-semibold text-text">Room Editor</h1>
						<span className="text-xs rounded border border-border px-2 py-0.5">Room {dashboard.code}</span>
						<span className="text-xs rounded border border-border px-2 py-0.5">
							Phase {dashboard.phase ?? "LOBBY"}
						</span>
						<span
							className={`text-xs rounded border px-2 py-0.5 ${
								reconnecting
									? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
									: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
							}`}
						>
							{reconnecting ? "Reconnecting..." : "Connected"}
						</span>
					</div>
					<div className="mt-2 text-sm text-text/90">
						Current song:{" "}
						{dashboard.activeSongIndex
							? `#${dashboard.activeSongIndex} - ${dashboard.currentSongTitle ?? "Untitled"}`
							: "None"}
					</div>
				</header>

				<div className="grid gap-4 xl:grid-cols-2">
					<section className="rounded-xl border border-border bg-card/40 p-4">
						<h2 className="text-lg font-semibold text-text mb-3">Current Round Guesses</h2>
						{dashboard.hasDetailLane && (
							<p className="text-xs text-text/70 mb-2">
								Question: {dashboard.detailQuestion ?? "Detail question enabled"}
							</p>
						)}
						<div className="mb-3 flex flex-wrap gap-2 text-xs">
							<span className="rounded border border-border px-2 py-1 text-text/80">
								Correct answer: <span className="text-text">{currentSong?.submitter ?? "-"}</span>
							</span>
							<span className="rounded border border-border px-2 py-1 text-text/80">
								Locked in: <span className="text-text">{lockedCount}/{totalGuessers}</span>
							</span>
							{dashboard.hasDetailLane && (
								<>
									<span className="rounded border border-border px-2 py-1 text-text/80">
										Detail correct: <span className="text-text">{currentSong?.detailAnswer ?? "-"}</span>
									</span>
									<span className="rounded border border-border px-2 py-1 text-text/80">
										Detail locked: <span className="text-text">{detailLockedCount}/{totalGuessers}</span>
									</span>
								</>
							)}
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-text/70 border-b border-border">
										<th className="py-2 pr-3">Player</th>
										<th className="py-2 pr-3">Guess</th>
										{dashboard.hasDetailLane && <th className="py-2 pr-3">Detail Guess</th>}
										<th className="py-2 pr-3">History</th>
									</tr>
								</thead>
								<tbody>
									{dashboard.currentSongRows.map((row) => (
										<tr key={row.playerName} className="border-b border-border/60 last:border-b-0">
											<td className="py-2 pr-3 text-text">{row.playerName}</td>
											<td className="py-2 pr-3 text-text">{row.guessLabel}</td>
											{dashboard.hasDetailLane && (
												<td className="py-2 pr-3 text-text">{row.detailLabel}</td>
											)}
											<td className="py-2 pr-3">
												<button
													type="button"
													className="rounded border border-border px-2 py-1 text-xs text-text/90 hover:bg-card/80"
													onClick={() => setSelectedHistoryPlayer(row.playerName)}
												>
													View
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>

					<section className="rounded-xl border border-border bg-card/40 p-4">
						<h2 className="text-lg font-semibold text-text mb-2">Guess History</h2>
						<div className="text-xs text-text/70 mb-3">
							Showing: <span className="text-text">{selectedHistoryPlayer ?? "No player selected"}</span>
						</div>
						<div className="overflow-x-auto rounded-xl border border-border">
							<table className="min-w-full text-sm">
								<thead className="bg-card/70">
									<tr className="text-left text-text/70 border-b border-border">
										<th className="py-2 px-3">Song</th>
										<th className="py-2 px-3">Guess</th>
										<th className="py-2 px-3">Correct</th>
										<th className="py-2 px-3">Locked</th>
										{dashboard.hasDetailLane && (
											<>
												<th className="py-2 px-3">Detail Guess</th>
												<th className="py-2 px-3">Detail Correct</th>
												<th className="py-2 px-3">Detail Locked</th>
											</>
										)}
									</tr>
								</thead>
								<tbody>
									{selectedHistoryRows.map((row) => (
										<tr key={row.songId} className="border-b border-border/60 last:border-b-0">
											<td className="py-2 px-3 text-text">#{row.songIndex} {row.songTitle || "Untitled"}</td>
											<td className="py-2 px-3 text-text">{row.guessLabel}</td>
											<td className="py-2 px-3 text-text">{row.correctAnswer || "-"}</td>
											<td className="py-2 px-3 text-text/80">
												{row.locked ? "Yes" : row.guessOrder.length > 0 ? "In progress" : "No"}
											</td>
											{dashboard.hasDetailLane && (
												<>
													<td className="py-2 px-3 text-text">{row.detailGuessLabel}</td>
													<td className="py-2 px-3 text-text">{row.detailCorrectAnswer || "-"}</td>
													<td className="py-2 px-3 text-text/80">
														{row.detailLocked ? "Yes" : row.detailGuessOrder.length > 0 ? "In progress" : "No"}
													</td>
												</>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				</div>

				{dashboard.theme.enabled && (
					<section className="rounded-xl border border-border bg-card/40 p-4">
						<h2 className="text-lg font-semibold text-text mb-2">Theme Side-Game</h2>
						<div className="text-xs text-text/70 mb-3">
							Hint: {dashboard.theme.hint ?? "-"} | Revealed: {dashboard.theme.revealed ? "Yes" : "No"}
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-text/70 border-b border-border">
										<th className="py-2 pr-3">Player</th>
										<th className="py-2 pr-3">Theme Status</th>
									</tr>
								</thead>
								<tbody>
									{dashboard.currentSongRows.map((row) => (
										<tr key={`${row.playerName}-theme`} className="border-b border-border/60 last:border-b-0">
											<td className="py-2 pr-3 text-text">{row.playerName}</td>
											<td className="py-2 pr-3 text-text/80">
												{row.themeSolved
													? "Solved"
													: row.themeGuessedThisRound
														? "Guessed this round"
														: "No guess this round"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				)}
			</main>
		</BackgroundShell>
	);
}
