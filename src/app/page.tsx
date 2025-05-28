"use client";
// src/app/page.tsx

import HostCard from "@/components/ui/HostCard";
import JoinCard from "@/components/ui/JoinCard";
import { useSocket } from "@/contexts/SocketContext";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function HomePage() {
	const router = useRouter();
	const socket = useSocket();

	const [theme, setTheme] = useState<string>("");
	const [backgroundUrl, setBackgroundUrl] = useState<string>("");
	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");

	// Create lobby: send theme + background URL directly
	const handleCreate = async (e: FormEvent) => {
		e.preventDefault();
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
			return alert(err.error || "Could not create room");
		}
		const { code } = await res.json();
		router.push(`/host/${code}`);
	};

	// Join lobby: as before
	const handleJoin = (e: FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !roomCode.trim()) return;
		socket.emit("joinRoom", { code: roomCode, name }, (ok: boolean) => {
			if (ok) {
				router.push(`/join/${roomCode}?name=${encodeURIComponent(name)}`);
			} else {
				alert("Failed to join—check the room code and try again.");
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

			<div
				className="
          border border-border rounded-2xl p-8 
          flex flex-col md:flex-row gap-8 
          bg-card bg-opacity-20 backdrop-blur-xl
        "
			>
				<div className="flex-1">
					<HostCard
						theme={theme}
						onThemeChange={setTheme}
						backgroundUrl={backgroundUrl}
						onBackgroundChange={setBackgroundUrl}
						onCreate={handleCreate}
						className="space-y-4"
					/>
				</div>
				<div className="flex-1">
					<JoinCard
						name={name}
						onNameChange={setName}
						code={roomCode}
						onRoomCodeChange={setRoomCode}
						onJoin={handleJoin}
						className="space-y-4"
					/>
				</div>
			</div>
		</main>
	);
}
