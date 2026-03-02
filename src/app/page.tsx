"use client";
// src/app/page.tsx

import HostCard from "@/components/ui/HostCard";
import JoinCard from "@/components/ui/JoinCard";
import GlassCard from "@/components/ui/GlassCard";
import { useGame } from "@/contexts/tempContext";
import { useSocket } from "@/contexts/SocketContext";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { AvatarConfig } from "@/types/avatar";
import Button from "@/components/ui/Button";

export default function HomePage() {
	const router = useRouter();
	const socket = useSocket();

	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");
	const [joining, setJoining] = useState(false);
	const [creating, setCreating] = useState(false);
	const [mode, setMode] = useState<"host" | "player">("player");
	const [error, setError] = useState<string | null>(null);

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

	// Create lobby: send theme + background URL via socket
	const handleCreate = async (e: FormEvent) => {
		e.preventDefault();
		if (creating) return;
		setCreating(true);

		const themeValue = theme?.trim() ?? "";
		const bgValue = backgroundUrl.trim() ? backgroundUrl : null;

		const avatar = getStoredAvatar();
		socket.emit(
			"createRoom",
			{ theme: themeValue, backgroundUrl: bgValue, hostName: "Host", avatar: avatar ?? undefined },
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
		});
	};

	// Join lobby
	const handleJoin = (e: FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !roomCode.trim() || joining) return;

		setJoining(true);
		const code = roomCode.trim().toUpperCase();

		const avatar = getStoredAvatar();
		socket.emit("joinRoom", { code, name, avatar: avatar ?? undefined }, (ok: boolean) => {
			if (ok) {
				router.push(`/join/${code}?name=${encodeURIComponent(name)}`);
			} else {
				setError("Failed to join—check the room code and try again.");
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
			{/* Shared container for heading + card */}
			<div className="w-full max-w-sm flex flex-col items-center">
				{/* Container for heading */}
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

				{/* Single card with toggle and conditional form */}
				<div
					className="
					relative z-10 w-full border border-border rounded-2xl p-8
					bg-card bg-opacity-20 backdrop-blur-xl
					flex flex-col items-center
					"
				>
					{/* Toggle buttons */}
					<div role="tablist" aria-label="Mode" className="flex w-full mb-6 gap-4">
						<Button
							type="button"
							role="tab"
							aria-selected={mode === "host"}
							onClick={() => {
								setMode("host");
								if (error) setError(null);
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
							}}
							variant={mode === "player" ? "primary" : "secondary"}
							size="md"
							className="flex-1"
						>
							Player
						</Button>
					</div>
					{/* Error message slot (prevents layout jump) */}
					<div className="w-full" aria-live="polite">
						{error && <p className="text-sm text-red-400 text-center">{error}</p>}
					</div>
					{/* Conditionally render based on mode */}
					{mode === "host" ? (
						<HostCard
							theme={theme}
							onThemeChange={setTheme}
							backgroundUrl={backgroundUrl}
							onBackgroundChange={setBackgroundUrl}
							onCreate={handleCreate}
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
