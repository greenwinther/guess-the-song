"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import useAvatarPreviewTilt from "@/hooks/home/useAvatarPreviewTilt";
import { getStoredAvatar } from "@/lib/avatarStorage";
import { firstFieldIssue, joinLobbyFormSchema } from "@/shared/schemas";

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

				try {
					localStorage.setItem(`gts-host-room-${resp.code}`, JSON.stringify({ name: "Host" }));
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

		socket.emit("joinRoom", { code, name: playerName, avatar: avatar ?? undefined }, (ok: boolean) => {
			if (ok) {
				router.push(`/join/${code}?name=${encodeURIComponent(playerName)}`);
			} else {
				setError("Failed to join - check the room code and try again.");
				setJoining(false);
			}
		});
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
