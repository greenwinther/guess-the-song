"use client";
// src/components/SongSubmitForm.tsx

import { useSocket } from "@/contexts/SocketContext";
import { useState, useEffect } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { getYouTubeID } from "@/lib/youtube";
import Image from "next/image";
import { firstFieldIssue, songSubmitFormSchema } from "@/shared/schemas";

interface Props {
	code: string;
	defaultSubmitter?: string;
	onUrlChange?: (url: string) => void;
	disabled?: boolean;
}

interface VideoResult {
	id: { videoId: string };
	snippet: { title: string; thumbnails: any };
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "").replace(/\/$/, "");
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export default function SongSubmitForm({
	code,
	defaultSubmitter = "",
	onUrlChange,
	disabled = false,
}: Props) {
	const socket = useSocket();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<VideoResult[]>([]);
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const [url, setUrl] = useState("");
	const [title, setTitle] = useState("");
	const [submitter, setSubmitter] = useState(defaultSubmitter);
	const [detailAnswer, setDetailAnswer] = useState("");
	const [urlError, setUrlError] = useState<string | null>(null);
	const [submitterError, setSubmitterError] = useState<string | null>(null);
	const [detailError, setDetailError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [searchError, setSearchError] = useState<string | null>(null);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedQuery(query);
		}, 500);
		return () => clearTimeout(handler);
	}, [query]);

	// 1) autocomplete search
	useEffect(() => {
		if (!debouncedQuery) {
			setResults([]);
			setSearchError(null);
			return;
		}

		const controller = new AbortController();
		fetch(apiUrl(`/api/youtube-search?q=${encodeURIComponent(debouncedQuery)}`), {
			signal: controller.signal,
		})
			.then(async (r) => {
				const json = await r.json();
				if (!r.ok) {
					throw new Error(json?.error || "Search failed");
				}
				setResults(json.items || []);
				setSearchError(null);
			})
			.catch((err: unknown) => {
				if ((err as { name?: string })?.name === "AbortError") return;
				setResults([]);
				setSearchError("Could not load search results. Try again.");
			});

		return () => controller.abort();
	}, [debouncedQuery]);

	// 2) when host picks a suggestion
	const pick = (video: VideoResult) => {
		setUrl(`https://www.youtube.com/watch?v=${video.id.videoId}`);
		setTitle(video.snippet.title);
		setResults([]);
		setUrlError(null);
		setSubmitError(null);
	};

	// 3) when host manually pastes a URL
	useEffect(() => {
		const vid = getYouTubeID(url);
		if (vid) {
			fetch(apiUrl(`/api/youtube-title?id=${vid}`))
				.then((r) => r.json())
				.then((j) => setTitle(j.title || ""))
				.catch(() => setTitle(""));
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
		if (disabled) return;

		setUrlError(null);
		setSubmitterError(null);
		setDetailError(null);
		setSubmitError(null);

		const validation = songSubmitFormSchema.safeParse({
			url,
			submitter,
			detailAnswer,
		});

		if (!validation.success) {
			setUrlError(firstFieldIssue(validation.error, "url"));
			setSubmitterError(firstFieldIssue(validation.error, "submitter"));
			setDetailError(firstFieldIssue(validation.error, "detailAnswer"));
			setSubmitError("Please fix the highlighted fields.");
			return;
		}

		socket.emit(
			"addSong",
			{
				code,
				url: validation.data.url,
				submitter: validation.data.submitter,
				title,
				detailAnswer: validation.data.detailAnswer,
			},
			(res) => {
				if (!res?.success) {
					setSubmitError(res?.error || "Could not add song");
					return;
				}
				setUrl("");
				setTitle("");
				setQuery("");
				setSubmitter(defaultSubmitter);
				setDetailAnswer("");
				setUrlError(null);
				setSubmitterError(null);
				setDetailError(null);
				setSubmitError(null);
			}
		);
	};

	return (
		<form onSubmit={onSubmit} className="relative flex flex-wrap gap-2 items-start">
			<div className="flex-[2] min-w-0">
				<Input
					placeholder="Search or paste YouTube URL"
					value={title || query || url}
					variant={urlError ? "error" : "default"}
					onChange={(e) => {
						if (disabled) return;
						const v = e.target.value;
						setTitle("");
						setUrlError(null);
						setSubmitError(null);
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

			<div className="flex-1 min-w-0">
				<Input
					placeholder="Your name"
					value={submitter}
					variant={submitterError ? "error" : "default"}
					onChange={(e) => {
						if (disabled) return;
						setSubmitter(e.target.value);
						setSubmitterError(null);
						setSubmitError(null);
					}}
					className="w-full"
				/>
			</div>

			<Button type="submit" disabled={disabled}>
				Add Song
			</Button>

			<div className="w-full">
				<Input
					placeholder="Answer for question (optional)"
					value={detailAnswer}
					variant={detailError ? "error" : "default"}
					onChange={(e) => {
						if (disabled) return;
						setDetailAnswer(e.target.value);
						setDetailError(null);
						setSubmitError(null);
					}}
					className="w-full"
				/>
			</div>

			{(urlError || submitterError || detailError || submitError || searchError) && (
				<div className="w-full text-xs text-red-400" aria-live="polite">
					{urlError || submitterError || detailError || submitError || searchError}
				</div>
			)}

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
