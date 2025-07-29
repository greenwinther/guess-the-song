"use client";
// src/app/page.tsx

import HostCard from "@/components/ui/HostCard";
import JoinCard from "@/components/ui/JoinCard";
import { useGame } from "@/contexts/tempContext";
import { useSocket } from "@/contexts/SocketContext";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function HomePage() {
	const router = useRouter();
	const socket = useSocket();

	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");
	const [joining, setJoining] = useState(false);
	const [creating, setCreating] = useState(false);
	const [mode, setMode] = useState<"host" | "player">("host");

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

	// Join lobby: as before
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

	return (
		<main
			className="
        min-h-screen flex flex-col items-center justify-center p-8 
        bg-gradient-to-br from-bg to-secondary
      "
		>
			<h1
				className="
          text-6xl font-extrabold mb-12 
          text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary
        "
			>
				Guess <span className="underline decoration-highlight">the</span> Song
			</h1>

			{/* Single card with toggle and conditional form */}
			<div
				className="
          w-full max-w-xl border border-border rounded-2xl p-8 
          bg-card bg-opacity-20 backdrop-blur-xl
        "
			>
				{/* Toggle buttons */}
				<div className="flex justify-center mb-6 space-x-4">
					<button
						onClick={() => setMode("host")}
						className={`px-4 py-2 rounded-lg font-semibold transition ${
							mode === "host" ? "bg-primary text-white" : "bg-card text-text-muted"
						}`}
					>
						Host
					</button>
					<button
						onClick={() => setMode("player")}
						className={`px-4 py-2 rounded-lg font-semibold transition ${
							mode === "player" ? "bg-primary text-white" : "bg-card text-text-muted"
						}`}
					>
						Player
					</button>
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
		</main>
	);
}
