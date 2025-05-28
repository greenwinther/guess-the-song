"use client";
// src/components/SongSubmitForm.tsx

import { useSocket } from "@/contexts/SocketContext";
import { Song } from "@/types/room";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Input from "./ui/Input";
import Button from "./ui/Button";

interface Props {
	code: string;
	defaultSubmitter?: string;
}

export default function SongSubmitForm({ code, defaultSubmitter = "" }: Props) {
	const socket = useSocket();
	const [url, setUrl] = useState("");
	const [submitter, setSubmitter] = useState(defaultSubmitter);

	useEffect(() => {
		if (defaultSubmitter) setSubmitter(defaultSubmitter);
	}, [defaultSubmitter]);

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		socket.emit(
			"addSong",
			{ code, url, submitter },
			(res: { success: boolean; song?: Song; error?: string }) => {
				if (!res.success) {
					toast.error("Add song failed: " + res.error);
				} else {
					setUrl("");
					if (!defaultSubmitter) setSubmitter("");
				}
			}
		);
	};

	return (
		<form onSubmit={onSubmit} className="mt-6 flex gap-4">
			<Input
				type="text"
				placeholder="Song URL"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				required
				size="md"
				variant="default"
				className="flex-1"
			/>
			<Input
				type="text"
				placeholder="Submitter Name"
				value={submitter}
				onChange={(e) => setSubmitter(e.target.value)}
				required
				size="md"
				variant="default"
				className="flex-1"
				disabled={!!defaultSubmitter}
			/>
			<Button type="submit" variant="primary" size="md" className="px-6">
				Add Song
			</Button>
		</form>
	);
}
