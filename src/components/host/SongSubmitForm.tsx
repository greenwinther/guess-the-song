"use client";
// src/components/SongSubmitForm.tsx

import { useSocket } from "@/contexts/SocketContext";
import { useState, useEffect } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { getYouTubeID } from "@/lib/youtube";
import Image from "next/image";

interface Props {
	code: string;
	defaultSubmitter?: string;
	onUrlChange?: (url: string) => void;
}

interface VideoResult {
	id: { videoId: string };
	snippet: { title: string; thumbnails: any };
}

export default function SongSubmitForm({ code, defaultSubmitter = "", onUrlChange }: Props) {
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

	useEffect(() => {
		if (onUrlChange) {
			onUrlChange(url);
		}
	}, [url, onUrlChange]);

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
		<form onSubmit={onSubmit} className="relative flex gap-2 items-center">
			{/* 1) Search / URL — twice as wide */}
			<div className="flex-[2] min-w-0">
				<Input
					placeholder="Search or paste YouTube URL"
					value={title || query || url}
					onChange={(e) => {
						const v = e.target.value;
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
			</div>

			{/* 2) Name — half the width of search */}
			<div className="flex-1 min-w-0">
				<Input
					placeholder="Your name"
					value={submitter}
					onChange={(e) => setSubmitter(e.target.value)}
					className="w-full"
				/>
			</div>

			{/* 3) Button */}
			<Button type="submit">Add Song</Button>

			{/* 4) Dropdown spanning full form width */}
			{results.length > 0 && (
				<ul
					className={`
        absolute left-0 top-full w-full
        z-10 bg-card bg-opacity-80 border border-border
        mt-1 max-h-60 overflow-auto rounded
      `}
				>
					{results.map((v) => (
						<li
							key={v.id.videoId}
							onClick={() => pick(v)}
							className="p-2 hover:bg-card hover:bg-opacity-60 cursor-pointer flex items-center space-x-2"
						>
							<Image
								src={v.snippet.thumbnails.default.url}
								alt={`Thumbnail for ${v.snippet.title}`}
								width={40}
								height={40}
								className="object-cover rounded flex-shrink-0"
							/>
							<span className="text-text">{v.snippet.title}</span>
						</li>
					))}
				</ul>
			)}
		</form>
	);
}
