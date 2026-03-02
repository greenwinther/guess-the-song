"use client";
// src/app/page.tsx

import HostCard from "@/components/ui/HostCard";
import JoinCard from "@/components/ui/JoinCard";
import { useGame } from "@/contexts/tempContext";
import { useSocket } from "@/contexts/SocketContext";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { AvatarConfig } from "@/types/avatar";
import Button from "@/components/ui/Button";
import { createLobbyFormSchema, firstFieldIssue, joinLobbyFormSchema } from "@/shared/schemas";

export default function HomePage() {
	const router = useRouter();
	const socket = useSocket();

	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");
	const [joining, setJoining] = useState(false);
	const [creating, setCreating] = useState(false);
	const [mode, setMode] = useState<"host" | "player">("player");
	const [error, setError] = useState<string | null>(null);
	const [joinNameError, setJoinNameError] = useState<string | null>(null);
	const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
	const [createThemeError, setCreateThemeError] = useState<string | null>(null);
	const [createBgError, setCreateBgError] = useState<string | null>(null);

	const { theme, setTheme, backgroundUrl, setBackgroundUrl } = useGame();
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

	// Create lobby: validate first, then send theme + background URL via socket
	const handleCreate = (e: FormEvent) => {
		e.preventDefault();
		if (creating) return;

		setCreateThemeError(null);
		setCreateBgError(null);
		setError(null);

		const validation = createLobbyFormSchema.safeParse({ theme, backgroundUrl });
		if (!validation.success) {
			setCreateThemeError(firstFieldIssue(validation.error, "theme"));
			setCreateBgError(firstFieldIssue(validation.error, "backgroundUrl"));
			setError("Please fix the highlighted fields.");
			return;
		}

		setCreating(true);
		const avatar = getStoredAvatar();
		socket.emit(
			"createRoom",
			{
				theme: validation.data.theme,
				backgroundUrl: validation.data.backgroundUrl,
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
				router.push(`/host/${resp.code}`);
				setCreating(false);
			}
		);
	};

	// Join lobby
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

	return (
		<main
			className="
			min-h-screen flex flex-col items-center justify-center p-8
			bg-gradient-to-br from-bg to-secondary
			"
		>
			<div className="w-full max-w-sm flex flex-col items-center">
				<div className="relative z-20 overflow-visible w-full">
					<h1
						className="
							text-center
							text-5xl sm:text-5xl font-extrabold tracking-tight
							text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary
							drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]
							leading-[1.15] overflow-visible pb-10
							"
					>
						Guess the Song
					</h1>
				</div>

				<div
					className="
					relative z-10 w-full border border-border rounded-2xl p-8
					bg-card bg-opacity-20 backdrop-blur-xl
					flex flex-col items-center
					"
				>
					<div role="tablist" aria-label="Mode" className="flex w-full mb-6 gap-4">
						<Button
							type="button"
							role="tab"
							aria-selected={mode === "host"}
							onClick={() => {
								setMode("host");
								if (error) setError(null);
								setJoinNameError(null);
								setJoinCodeError(null);
							}}
							variant={mode === "host" ? "primary" : "secondary"}
							size="md"
							className="flex-1"
						>
							Host
						</Button>
						<Button
							type="button"
							role="tab"
							aria-selected={mode === "player"}
							onClick={() => {
								setMode("player");
								if (error) setError(null);
								setCreateThemeError(null);
								setCreateBgError(null);
							}}
							variant={mode === "player" ? "primary" : "secondary"}
							size="md"
							className="flex-1"
						>
							Player
						</Button>
					</div>
					<div className="w-full" aria-live="polite">
						{error && <p className="text-sm text-red-400 text-center">{error}</p>}
					</div>
					{mode === "host" ? (
						<HostCard
							theme={theme}
							onThemeChange={setTheme}
							backgroundUrl={backgroundUrl}
							onBackgroundChange={setBackgroundUrl}
							onCreate={handleCreate}
							themeError={createThemeError}
							backgroundUrlError={createBgError}
							disabled={creating}
							isLoading={creating}
							className="space-y-4"
						/>
					) : (
						<JoinCard
							name={name}
							onNameChange={setName}
							code={roomCode}
							onRoomCodeChange={setRoomCode}
							onJoin={handleJoin}
							nameError={joinNameError}
							codeError={joinCodeError}
							disabled={joining}
							isLoading={joining}
							className="space-y-4"
						/>
					)}
				</div>
			</div>
		</main>
	);
}
