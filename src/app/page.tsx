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
		<main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
			<h1 className="text-4xl font-bold mb-8">Guess the Song</h1>
			<div className="flex flex-col md:flex-row gap-6">
				<HostCard
					theme={theme}
					onThemeChange={setTheme}
					backgroundFile={backgroundFile}
					onBackgroundChange={setBackgroundFile}
					onCreate={handleCreate}
				/>
				<JoinCard
					name={name}
					onNameChange={setName}
					code={roomCode}
					onRoomCodeChange={setRoomCode}
					onJoin={handleJoin}
				/>
			</div>
		</main>
	);
}
