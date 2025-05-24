// src/component/HostSongSetup.tsx
"use client";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function HostSongSetup() {
	const [theme, setTheme] = useState("");
	const [uploading, setUploading] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		let backgroundUrl: string | null = null;

		if (fileInput.current?.files?.[0]) {
			setUploading(true);
			const formData = new FormData();
			formData.append("file", fileInput.current.files[0]);
			try {
				const res = await fetch("/api/upload", {
					method: "POST",
					body: formData,
				});
				const json = await res.json();
				if (!res.ok) throw new Error(json.error || "Upload failed");
				backgroundUrl = json.url;
			} catch (err: any) {
				toast.error("Image upload failed: " + err.message);
				setUploading(false);
				return;
			}
			setUploading(false);
		}

		// Now create the room
		try {
			const res = await fetch("/api/rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ theme, backgroundUrl }),
			});
			const { code } = await res.json();
			router.push(`/host/${code}`);
		} catch (err: any) {
			toast.error("Could not create room: " + err.message);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<input
				type="text"
				placeholder="Theme name"
				value={theme}
				onChange={(e) => setTheme(e.target.value)}
				required
				className="input"
			/>

			<input type="file" accept="image/*" ref={fileInput} disabled={uploading} className="file-input" />

			<button type="submit" disabled={uploading} className="btn">
				{uploading ? "Uploading…" : "Create Lobby"}
			</button>
		</form>
	);
}
