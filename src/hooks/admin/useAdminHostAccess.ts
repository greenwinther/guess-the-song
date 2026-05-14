"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import type { AccessStatus } from "@/lib/accessStatus";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";

export type AdminAccessState = "authorized" | AccessStatus;

const getClientId = () => {
	const key = "gts-client-id";
	let value = localStorage.getItem(key);
	if (!value) {
		value = crypto.randomUUID();
		localStorage.setItem(key, value);
	}
	return value;
};

type StoredAdminAccess = {
	adminToken?: string;
	hostToken?: string;
	hostName?: string;
};

const adminKey = (code: string) => `gts-admin-room-${code}`;

export function useAdminHostAccess(code: string) {
	const socket = useSocket();
	const [room, setRoom] = useState<Room | null>(null);
	const [access, setAccess] = useState<AdminAccessState>("checking");
	const [stored, setStored] = useState<StoredAdminAccess | null>(null);
	const deniedRef = useRef<null | "not_found" | "unauthorized" | "error">(null);

	useEffect(() => {
		setRoom(null);
		setAccess("checking");
		setStored(null);
		deniedRef.current = null;
		try {
			const raw = localStorage.getItem(adminKey(code));
			if (!raw) {
				setAccess("unauthorized");
				return;
			}
			const parsed = JSON.parse(raw) as StoredAdminAccess;
			if (!parsed?.adminToken || !parsed?.hostToken) {
				setAccess("unauthorized");
				return;
			}
			setStored(parsed);
		} catch {
			setAccess("unauthorized");
		}
	}, [code]);

	useEffect(() => {
		if (!socket || !stored || access === "unauthorized") return;

		const onRoomData = (nextRoom: Room) => {
			setRoom(nextRoom);
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
		const doJoinAdmin = () => {
			socket.emit(
				"joinAdminRoom",
				{ code, adminToken: stored.adminToken ?? "", clientId: getClientId() },
				(res) => {
					if (res.ok) return;
					deniedRef.current = res.reason;
					if (res.reason === "not_found") {
						setAccess("not_found");
						return;
					}
					setAccess("unauthorized");
				},
			);
		};

		socket.on("roomData", onRoomData);
		socket.on("songAdded", onSongAdded);
		socket.on("songRemoved", onSongRemoved);
		socket.on("THEME_UPDATED", onThemeUpdated);
		socket.on("gameStarted", onGameStarted);
		if (socket.connected) doJoinAdmin();
		socket.on("connect", doJoinAdmin);

		return () => {
			socket.off("roomData", onRoomData);
			socket.off("songAdded", onSongAdded);
			socket.off("songRemoved", onSongRemoved);
			socket.off("THEME_UPDATED", onThemeUpdated);
			socket.off("gameStarted", onGameStarted);
			socket.off("connect", doJoinAdmin);
		};
	}, [socket, code, stored, access]);

	const hostLink = useMemo(() => {
		if (!stored?.hostToken) return null;
		return `/host/${code}?token=${encodeURIComponent(stored.hostToken)}`;
	}, [code, stored?.hostToken]);

	return { access, room, setAccess, hostLink };
}
