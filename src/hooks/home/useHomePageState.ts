"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import useAvatarPreviewTilt from "@/hooks/home/useAvatarPreviewTilt";
import { getStoredAvatar } from "@/lib/avatarStorage";
import { firstFieldIssue, joinLobbyFormSchema } from "@/shared/schemas";

const getClientId = () => {
	const key = "gts-client-id";
	let value = localStorage.getItem(key);
	if (!value) {
		value = crypto.randomUUID();
		localStorage.setItem(key, value);
	}
	return value;
};

export function useHomePageState() {
	const router = useRouter();
	const socket = useSocket();
	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");
	const [joining, setJoining] = useState(false);
	const [creating, setCreating] = useState(false);
	const [view, setView] = useState<"join" | "create">("join");
	const [error, setError] = useState<string | null>(null);
	const [joinNameError, setJoinNameError] = useState<string | null>(null);
	const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
	const [randomizeSignal, setRandomizeSignal] = useState(0);
	const cardRef = useRef<HTMLDivElement | null>(null);
	const avatarPreviewRef = useRef<HTMLDivElement | null>(null);

	useAvatarPreviewTilt({ cardRef, avatarPreviewRef });

	const clearMessages = () => {
		setError(null);
		setJoinNameError(null);
		setJoinCodeError(null);
	};

	const handleViewChange = (nextView: "join" | "create") => {
		clearMessages();
		setView(nextView);
	};

	const triggerRandomize = () => setRandomizeSignal((current) => current + 1);

	const handleCreate = (e: FormEvent) => {
		e.preventDefault();
		if (creating) return;

		setError(null);
		setCreating(true);
		const avatar = getStoredAvatar();

		socket.emit(
			"createRoom",
			{
				theme: "",
				backgroundUrl: null,
				hostName: "Host",
				avatar: avatar ?? undefined,
			},
			(resp) => {
				if (!resp?.code) {
					setError(resp?.error || "Could not create room");
					setCreating(false);
					return;
				}
				if (!resp.adminToken || !resp.hostToken) {
					setError("Could not initialize room access.");
					setCreating(false);
					return;
				}

				try {
					localStorage.setItem(
						`gts-admin-room-${resp.code}`,
						JSON.stringify({
							adminToken: resp.adminToken,
							hostToken: resp.hostToken,
							hostName: "Host",
						})
					);
				} catch {}

				router.push(`/admin/${resp.code}`);
				setCreating(false);
			},
		);
	};

	const handleJoin = (e: FormEvent) => {
		e.preventDefault();
		if (joining) return;

		setJoinNameError(null);
		setJoinCodeError(null);
		setError(null);

		const validation = joinLobbyFormSchema.safeParse({ name, roomCode });
		if (!validation.success) {
			setJoinNameError(firstFieldIssue(validation.error, "name"));
			setJoinCodeError(firstFieldIssue(validation.error, "roomCode"));
			setError("Please fix the highlighted fields.");
			return;
		}

		setJoining(true);
		const code = validation.data.roomCode;
		const playerName = validation.data.name;
		const avatar = getStoredAvatar();
		const clientId = getClientId();
		let deniedReason:
			| "kicked"
			| "closed"
			| "not_found"
			| "name_taken"
			| "unauthorized"
			| "error"
			| null = null;
		const onJoinDenied = (data: {
			reason: "kicked" | "closed" | "not_found" | "name_taken" | "unauthorized" | "error";
		}) => {
			deniedReason = data.reason;
		};
		socket.on("joinDenied", onJoinDenied);

		socket.emit(
			"joinRoom",
			{ code, name: playerName, clientId, avatar: avatar ?? undefined },
			(ok: boolean) => {
				socket.off("joinDenied", onJoinDenied);
			if (ok) {
				router.push(`/join/${code}?name=${encodeURIComponent(playerName)}`);
			} else {
				if (deniedReason === "name_taken") {
					setError("That name is already taken in this room.");
				} else if (deniedReason === "not_found") {
					setError("Room not found. Check the room code and try again.");
				} else if (deniedReason === "closed") {
					setError("This room is closed.");
				} else if (deniedReason === "kicked") {
					setError("You were kicked from this room.");
				} else {
					setError("Failed to join - check the room code and try again.");
				}
				setJoining(false);
			}
			},
		);
	};

	const joinLocked = joining;
	const joinCanSubmit = !joinLocked && Boolean(name.trim()) && Boolean(roomCode.trim());
	const activeEntryLocked = view === "join" ? joinLocked : creating;

	return {
		activeEntryLocked,
		avatarPreviewRef,
		cardRef,
		creating,
		error,
		handleCreate,
		handleJoin,
		handleViewChange,
		joinCanSubmit,
		joinCodeError,
		joinLocked,
		joinNameError,
		joining,
		name,
		randomizeSignal,
		roomCode,
		setName,
		setRoomCode,
		triggerRandomize,
		view,
	};
}
