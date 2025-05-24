// src/components/SongSubmitForm.tsx
"use client";

import { useSocket } from "@/context/SocketContext";
import { useState } from "react";

export default function SongSubmitForm({ code }: { code: string }) {
	const socket = useSocket();
	const [url, setUrl] = useState("");
	const [submitter, setSubmitter] = useState("");

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		socket.emit("addSong", { code, url, submitter });
		setUrl("");
		setSubmitter("");
	};

	return (
		<form onSubmit={onSubmit} className="mt-8 flex space-x-2">
			<input
				type="text"
				placeholder="Song URL"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				required
				className="input flex-1"
			/>
			<input
				type="text"
				placeholder="Your name"
				value={submitter}
				onChange={(e) => setSubmitter(e.target.value)}
				required
				className="input flex-1"
			/>
			<button type="submit" className="btn">
				Add Song
			</button>
		</form>
	);
}
