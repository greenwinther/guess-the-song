"use client";
// src/components/SongSubmitForm.tsx

import { useSocket } from "@/contexts/SocketContext";
import { useState, useEffect } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { getYouTubeID } from "@/lib/youtube";

interface Props {
	code: string;
	defaultSubmitter?: string;
}

interface VideoResult {
	id: { videoId: string };
	snippet: { title: string; thumbnails: any };
}

export default function SongSubmitForm({ code, defaultSubmitter = "" }: Props) {
	const socket = useSocket();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<VideoResult[]>([]);
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const [url, setUrl] = useState("");
	const [title, setTitle] = useState("");
	const [submitter, setSubmitter] = useState(defaultSubmitter);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedQuery(query);
		}, 500);
		return () => clearTimeout(handler);
	}, [query]);

	// 1) autocomplete search
	useEffect(() => {
		// if they cleared out the field, clear results immediately
		if (!debouncedQuery) {
			setResults([]);
			return;
		}

		fetch(`/api/youtube-search?q=${encodeURIComponent(debouncedQuery)}`)
			.then((r) => r.json())
			.then((json) => setResults(json.items || []))
			.catch(() => setResults([]));
	}, [debouncedQuery]);

	// 2) when host picks a suggestion
	const pick = (video: VideoResult) => {
		setUrl(`https://www.youtube.com/watch?v=${video.id.videoId}`);
		setTitle(video.snippet.title);
		setResults([]);
	};

	// 3) when host manually pastes a URL
	useEffect(() => {
		const vid = getYouTubeID(url);
		if (vid) {
			fetch(`/api/youtube-title?id=${vid}`)
				.then((r) => r.json())
				.then((j) => setTitle(j.title || ""));
		} else {
			setTitle("");
		}
	}, [url]);

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// emit song URL + title + submitter
		socket.emit("addSong", { code, url, submitter, title }, () => {
			setUrl("");
			setTitle("");
			setQuery("");
			setSubmitter(defaultSubmitter);
		});
	};

	return (
		<form onSubmit={onSubmit} className="relative flex gap-2">
			<div className="flex-1">
				<Input
					placeholder="Search or paste YouTube URL"
					// 1) show `title` when set, otherwise the raw URL or query
					value={title || query || url}
					onChange={(e) => {
						const v = e.target.value;
						// as soon as they type, drop any previously chosen title
						setTitle("");
						if (/youtu/.test(v)) {
							setUrl(v);
							setQuery("");
						} else {
							setQuery(v);
							setUrl("");
						}
					}}
					className="w-full"
				/>
				{results.length > 0 && (
					<ul className="absolute z-10 bg-card bg-opacity-80 border border-border mt-1 w-full max-h-60 overflow-auto rounded">
						{results.map((v) => (
							<li
								key={v.id.videoId}
								onClick={() => pick(v)}
								className="p-2 hover:bg-card hover:bg-opacity-60 cursor-pointer flex items-center space-x-2"
							>
								<img src={v.snippet.thumbnails.default.url} width={40} />
								<span className="text-text">{v.snippet.title}</span>
							</li>
						))}
					</ul>
				)}
			</div>
			<Input
				placeholder="Your name"
				value={submitter}
				onChange={(e) => setSubmitter(e.target.value)}
				className="flex-1"
			/>
			<Button type="submit">Add Song</Button>
		</form>
	);
}
