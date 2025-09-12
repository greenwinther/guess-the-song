"use client";
// src/app/page.tsx

import HostCard from "@/components/ui/HostCard";
import JoinCard from "@/components/ui/JoinCard";
import { useGame } from "@/contexts/tempContext";
import { useSocket } from "@/contexts/SocketContext";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";

export default function HomePage() {
	const router = useRouter();
	const socket = useSocket();

	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");
	const [joining, setJoining] = useState(false);
	const [creating, setCreating] = useState(false);
	const [mode, setMode] = useState<"host" | "player">("host");
	const [error, setError] = useState<string | null>(null);

	const { theme, setTheme, backgroundUrl, setBackgroundUrl } = useGame();

	// Create lobby: send theme + background URL directly
	const handleCreate = async (e: FormEvent) => {
		e.preventDefault();
		setCreating(true);

		try {
			const res = await fetch("/api/rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					theme,
					backgroundUrl: backgroundUrl.trim() ? backgroundUrl : null,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				alert(err.error || "Could not create room");
				setCreating(false);
				return;
			}

			const { code } = await res.json();
			router.push(`/host/${code}`);
		} catch (err) {
			console.error("Lobby creation failed", err);
			alert("Something went wrong while creating the room");
			setCreating(false);
		}
	};

	// Join lobby
	const handleJoin = (e: FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !roomCode.trim() || joining) return;

		setJoining(true);

		socket.emit("joinRoom", { code: roomCode, name }, (ok: boolean) => {
			if (ok) {
				router.push(`/join/${roomCode}?name=${encodeURIComponent(name)}`);
			} else {
				alert("Failed to join—check the room code and try again.");
				setJoining(false);
			}
		});
	};

	{
		error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>;
	}

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
          text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400
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
							role="tab"
							aria-selected={mode === "host"}
							onClick={() => setMode("host")}
							variant={mode === "host" ? "primary" : "secondary"}
							size="md"
							className="flex-1"
						>
							Host
						</Button>
						<Button
							role="tab"
							aria-selected={mode === "player"}
							onClick={() => setMode("player")}
							variant={mode === "player" ? "primary" : "secondary"}
							size="md"
							className="flex-1"
						>
							Player
						</Button>
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
							className="space-y-4"
						/>
					)}
				</div>
			</div>
		</main>
	);
}
