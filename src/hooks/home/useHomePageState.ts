"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import useAvatarPreviewTilt from "@/hooks/home/useAvatarPreviewTilt";
import { getStoredAvatar } from "@/lib/avatarStorage";
import { firstFieldIssue, joinLobbyFormSchema } from "@/shared/schemas";
import { normalizeRoomCode } from "@/shared/validation/inputNormalization";

const getClientId = () => {
	const key = "gts-client-id";
	let value = localStorage.getItem(key);
	if (!value) {
		value = crypto.randomUUID();
		localStorage.setItem(key, value);
	}
	return value;
};

const PLAYER_NAME_STORAGE_KEY = "gts-player-name-v1";

export function useHomePageState() {
	const router = useRouter();
	const socket = useSocket();
	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");
	const [joining, setJoining] = useState(false);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nameError, setNameError] = useState<string | null>(null);
	const [roomCodeError, setRoomCodeError] = useState<string | null>(null);
	const [randomizeSignal, setRandomizeSignal] = useState(0);
	const cardRef = useRef<HTMLDivElement | null>(null);
	const avatarPreviewRef = useRef<HTMLDivElement | null>(null);

	useAvatarPreviewTilt({ cardRef, avatarPreviewRef });

	useEffect(() => {
		try {
			const stored = localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
			if (!stored) return;
			const nextName = String(stored).trim();
			if (!nextName) return;
			setName(nextName.slice(0, 24));
		} catch {}
	}, []);

	useEffect(() => {
		try {
			const nextName = name.trim();
			if (!nextName) {
				localStorage.removeItem(PLAYER_NAME_STORAGE_KEY);
				return;
			}
			localStorage.setItem(PLAYER_NAME_STORAGE_KEY, nextName.slice(0, 24));
		} catch {}
	}, [name]);

	const clearMessages = () => {
		setError(null);
		setNameError(null);
		setRoomCodeError(null);
	};

	const triggerRandomize = () => setRandomizeSignal((current) => current + 1);

	const setRoomCodeInput = (value: string) => {
		setRoomCode(normalizeRoomCode(value).slice(0, 4));
	};

	const handleCreate = (hostName: string) => {
		if (creating) return;

		clearMessages();
		setCreating(true);
		const avatar = getStoredAvatar();

		socket.emit(
			"createRoom",
			{
				theme: "",
				backgroundUrl: null,
				hostName,
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
							hostName,
						})
					);
				} catch {}

				router.push(`/admin/${resp.code}`);
				setCreating(false);
			},
		);
	};

	const handleJoin = (playerName: string, code: string) => {
		if (joining) return;

		setJoining(true);
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
						setNameError("That name is already taken in this room.");
						setError("That name is already taken in this room.");
					} else if (deniedReason === "not_found") {
						setRoomCodeError("Room not found. Check the room code and try again.");
						setError("Room not found. Check the room code and try again.");
					} else if (deniedReason === "closed") {
						setRoomCodeError("This room is closed.");
						setError("This room is closed.");
					} else if (deniedReason === "kicked") {
						setError("You were kicked from this room.");
					} else if (deniedReason === "unauthorized") {
						setRoomCodeError("You are not authorized for this room.");
						setError("You are not authorized for this room.");
					} else {
						setRoomCodeError("Check the room code and try again.");
						setError("Failed to join - check the room code and try again.");
					}
					setJoining(false);
				}
			},
		);
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (joining || creating) return;

		clearMessages();

		const trimmedName = name.trim();
		if (!trimmedName) {
			setNameError("Enter your name");
			setError("Please fix the highlighted fields.");
			return;
		}
		if (trimmedName.length > 24) {
			setNameError("Name must be 24 characters or fewer");
			setError("Please fix the highlighted fields.");
			return;
		}

		const hasRoomCode = Boolean(roomCode.trim());
		if (!hasRoomCode) {
			handleCreate(trimmedName);
			return;
		}

		const validation = joinLobbyFormSchema.safeParse({ name: trimmedName, roomCode });
		if (!validation.success) {
			setNameError(firstFieldIssue(validation.error, "name"));
			setRoomCodeError(firstFieldIssue(validation.error, "roomCode"));
			setError("Please fix the highlighted fields.");
			return;
		}

		handleJoin(validation.data.name, validation.data.roomCode);
	};

	const activeEntryLocked = joining || creating;
	const canSubmit = !activeEntryLocked && Boolean(name.trim());
	const isJoiningFlow = Boolean(roomCode.trim());
	const isRoomCodeReadyToJoin = roomCode.length === 4;

	return {
		activeEntryLocked,
		avatarPreviewRef,
		canSubmit,
		cardRef,
		creating,
		error,
		handleSubmit,
		joining,
		isJoiningFlow,
		isRoomCodeReadyToJoin,
		name,
		nameError,
		randomizeSignal,
		roomCode,
		roomCodeError,
		setRoomCode: setRoomCodeInput,
		setName,
		triggerRandomize,
	};
}
