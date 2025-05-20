// app/host-room/page.tsx
"use client";

import { useState } from "react";
import { useGameSocket } from "@/hooks/useGameSocket";
import { HostCreateRoomPayload } from "@/types/socket";
import { Song } from "@/types/game";
import { useRouter } from "next/navigation";

function generateId(): string {
	return crypto.randomUUID();
}

export default function HostRoomPage() {
	const [url, setUrl] = useState("");
	const [submittedBy, setSubmittedBy] = useState("");
	const [songs, setSongs] = useState<Song[]>([]);
	const router = useRouter();
	const [roomId] = useState(() => generateId());

	const { createRoom } = useGameSocket({
		onRoomCreated: (room) => {
			console.log("Room created!", room);
			router.push(`/host-room/${room.roomId}`);
		},
		onError: (msg) => alert(`Error: ${msg}`),
	});

	const handleAddSong = (e: React.FormEvent) => {
		e.preventDefault();
		if (!url || !submittedBy) return;

		const newSong: Song = {
			id: generateId(),
			url,
			submitter: submittedBy,
		};

		setSongs((prev) => [...prev, newSong]);
		setUrl("");
		setSubmittedBy("");
	};

	const handleRemoveSong = (index: number) => {
		setSongs((prev) => prev.filter((_, i) => i !== index));
	};

	const handleCreateRoom = () => {
		const payload: HostCreateRoomPayload = { songs, roomId };
		createRoom(payload);
	};

	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">🎵 Host: Create Game</h1>

			<form onSubmit={handleAddSong} className="space-y-4 mb-6">
				<input
					type="text"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="Song URL (e.g. YouTube)"
					className="w-full px-4 py-2 border rounded"
				/>
				<input
					type="text"
					value={submittedBy}
					onChange={(e) => setSubmittedBy(e.target.value)}
					placeholder="Submitted by (name)"
					className="w-full px-4 py-2 border rounded"
				/>
				<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
					➕ Add Song
				</button>
			</form>

			<ul className="mb-6 space-y-2">
				{songs.map((song, i) => (
					<li key={i} className="flex justify-between items-center border p-2 rounded">
						<div>
							<p className="font-medium">{song.submitter}</p>
							<p className="text-sm text-gray-600 truncate">{song.url}</p>
						</div>
						<button onClick={() => handleRemoveSong(i)} className="text-red-500 hover:underline">
							Remove
						</button>
					</li>
				))}
			</ul>

			<button
				onClick={handleCreateRoom}
				className="bg-green-600 text-white px-6 py-3 rounded text-lg w-full"
				disabled={songs.length === 0}
			>
				🚀 Create Room
			</button>
		</div>
	);
}
