"use client";
// src/components/home/HomePageClient.tsx

import AvatarActionRow from "@/components/home/AvatarActionRow";
import HomeModeToggle from "@/components/home/HomeModeToggle";
import HostInsetSlot from "@/components/home/HostInsetSlot";
import styles from "@/components/home/home.module.css";
import AvatarPicker from "@/components/ui/AvatarPicker";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useSocket } from "@/contexts/SocketContext";
import useAvatarPreviewTilt from "@/hooks/useAvatarPreviewTilt";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import type { AvatarConfig } from "@/types/avatar";
import { firstFieldIssue, joinLobbyFormSchema } from "@/shared/schemas";
import clsx from "clsx";

export default function HomePageClient() {
	const router = useRouter();
	const socket = useSocket();
	const contentWidthClass = "w-full max-w-[20rem]";

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

	const clearMessages = () => {
		setError(null);
		setJoinNameError(null);
		setJoinCodeError(null);
	};
	const triggerRandomize = () => setRandomizeSignal((current) => current + 1);

	useAvatarPreviewTilt({ cardRef, avatarPreviewRef });

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
				router.push(`/play/${code}?name=${encodeURIComponent(playerName)}`);
			} else {
				setError("Failed to join - check the room code and try again.");
				setJoining(false);
			}
		});
	};

	const joinLocked = joining;
	const joinCanSubmit = !joinLocked && Boolean(name.trim()) && Boolean(roomCode.trim());

	return (
		<main
			className="
			relative isolate min-h-screen overflow-hidden flex flex-col items-center justify-center p-8
			bg-gradient-to-br from-bg to-secondary
			"
		>
			<div
				ref={cardRef}
				className={clsx(
					styles.homeNeonCard,
					"relative z-10 flex w-fit max-w-full flex-col items-center rounded-[28px] p-[1.75px]",
				)}
			>
				<div
					className={clsx(
						styles.homeCardSurface,
						"relative w-full overflow-hidden rounded-[26px] px-4 py-5 sm:px-5 sm:py-6",
						"bg-card/20 backdrop-blur-xl shadow-2xl",
						"flex flex-col items-center gap-3",
					)}
				>
					<div className="flex w-fit max-w-full flex-col items-center gap-4 pb-2">
						<h1
							className="
									inline-flex w-fit max-w-full text-center
									text-[2.68rem] sm:text-[2.8rem] font-extrabold tracking-[-0.03em]
									leading-[1.08]
								"
						>
							<span
								className={clsx(
									styles.homeTitle,
									styles.homeTitleText,
									"text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary",
								)}
								data-text="Guess the Song"
							>
								Guess the Song
							</span>
						</h1>
						<div className={styles.homeTitleDivider} aria-hidden="true" />
					</div>
					<HomeModeToggle
						view={view}
						onViewChange={(nextView) => {
							clearMessages();
							setView(nextView);
						}}
						className={contentWidthClass}
					/>
					{error && (
						<p
							className="relative z-10 w-full text-center text-sm text-red-400"
							aria-live="polite"
						>
							{error}
						</p>
					)}
					<form
						onSubmit={view === "join" ? handleJoin : handleCreate}
						className={clsx("relative z-10 flex w-full flex-col gap-3", contentWidthClass)}
					>
						<div className="flex items-stretch gap-2">
							{view === "join" ? (
								<Input
									type="text"
									variant={joinNameError ? "error" : "default"}
									placeholder="Your Name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
									className="min-w-0 flex-1"
									disabled={joinLocked}
								/>
							) : (
								<div className="w-full">
									<HostInsetSlot label="Host Ready" />
								</div>
							)}
						</div>
						{view === "join" && joinNameError && (
							<p className="-mt-2 text-xs text-red-400">{joinNameError}</p>
						)}
						<AvatarActionRow
							onRandomize={triggerRandomize}
							disabled={view === "join" ? joinLocked : creating}
						/>
						<AvatarPicker
							compact
							showRandomizeButton={false}
							randomizeSignal={randomizeSignal}
							previewRef={avatarPreviewRef}
							previewClassName={styles.avatarPreviewTilt}
						/>
						{view === "join" ? (
							<>
								<Input
									type="text"
									variant={joinCodeError ? "error" : "default"}
									placeholder="Room Code"
									value={roomCode}
									onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
									required
									maxLength={4}
									className="w-full"
									disabled={joinLocked}
								/>
								{joinCodeError && (
									<p className="-mt-2 text-xs text-red-400">{joinCodeError}</p>
								)}
								<Button
									type="submit"
									variant="primary"
									size="md"
									className={clsx(styles.homeSubmitButton, "w-full")}
									loading={joining}
									disabled={!joinCanSubmit}
								>
									Join Lobby
								</Button>
							</>
						) : (
							<>
								<HostInsetSlot label="Settings in Lobby" />
								<Button
									type="submit"
									variant="primary"
									size="md"
									className={clsx(styles.homeSubmitButton, "w-full")}
									loading={creating}
									disabled={creating}
								>
									Create Lobby
								</Button>
							</>
						)}
					</form>
				</div>
			</div>
		</main>
	);
}
