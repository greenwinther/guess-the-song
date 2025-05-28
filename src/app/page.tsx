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
	const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");

	// Create lobby: call your API, then redirect
	const handleCreate = async (e: FormEvent) => {
		e.preventDefault();
		// 1) If host chose a file, upload it first
		let backgroundUrl: string | null = null;
		if (backgroundFile) {
			const up = new FormData();
			up.append("file", backgroundFile);
			const r1 = await fetch("/api/upload", { method: "POST", body: up });
			const j1 = await r1.json();
			if (!r1.ok) throw new Error(j1.error || "Upload failed");
			backgroundUrl = j1.url;
		}

		// 2) Now send JSON to create the room
		const r2 = await fetch("/api/rooms", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ theme, backgroundUrl }),
		});
		if (!r2.ok) {
			const err = await r2.json();
			throw new Error(err.error || "Could not create room");
		}
		const { code } = await r2.json();
		router.push(`/host/${code}`);
	};

	// Join lobby: navigate to dynamic join page
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
						backgroundFile={backgroundFile}
						onBackgroundChange={setBackgroundFile}
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
