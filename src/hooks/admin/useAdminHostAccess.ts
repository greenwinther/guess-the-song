"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { getStoredAvatar } from "@/lib/avatarStorage";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";

export type AdminAccessState = "checking" | "authorized" | "unauthorized" | "not_found";

const getClientId = () => {
	const key = "gts-client-id";
	let value = localStorage.getItem(key);
	if (!value) {
		value = crypto.randomUUID();
		localStorage.setItem(key, value);
	}
	return value;
};

const hostKey = (code: string) => `gts-host-room-${code}`;

export function useAdminHostAccess(code: string) {
	const socket = useSocket();
	const [hostName, setHostName] = useState("Host");
	const [room, setRoom] = useState<Room | null>(null);
	const [access, setAccess] = useState<AdminAccessState>("checking");
	const [canJoinAsHost, setCanJoinAsHost] = useState(false);
	const joinDeniedRef = useRef<null | "kicked" | "closed" | "not_found" | "error">(null);

	useEffect(() => {
		setRoom(null);
		setAccess("checking");
		setCanJoinAsHost(false);
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
				!prev ? prev : { ...prev, songs: prev.songs.filter((song) => song.id !== songId) },
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
				},
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

	return { access, room, setAccess };
}
