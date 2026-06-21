// src/components/host/common/HostPlaylistPanel.tsx
"use client";

import { useEffect, useId, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import Button from "@/components/shared/Button";
import AvatarStack from "@/components/shared/AvatarStack";
import PlaylistSidebar from "@/components/shared/playlist/PlaylistSidebar";
import { useRoomState } from "@/contexts/gameContext";
import { useSocket } from "@/contexts/SocketContext";
import { useHostPlaylistReveals } from "@/hooks/host/useHostPlaylistReveals";
import type { Member } from "@/types/member";
import type { Room } from "@/types/room";
import type { Submission } from "@/types/submission";
import type { SongGuessStats } from "@/types/socket";
import HostPlaylistSongRow from "./HostPlaylistSongRow";

type HostPlaylistPanelProps = {
	songs: Submission[];
	roomOverride?: Room | null;
	revealedIds?: number[];
	currentSongId?: number | null;
	onSelect?: (song: Submission) => void;
	allPlayed?: boolean;
	showSongDetails?: boolean;
	showRevealControls?: boolean;
	useSongArtworkBackground?: boolean;
	onToggleSongArtworkBackground?: () => void;
};

function PlayerAvatarBadge({ playerName, player }: { playerName: string; player?: Member }) {
	const initials = playerName
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	return (
		<div className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-black/15 px-2 py-2">
			{player?.avatar?.base ? (
				<AvatarStack avatar={player.avatar} size={48} className="h-12 w-12 shrink-0" title={playerName} />
			) : (
				<div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border/70 bg-card/45 text-sm font-bold text-secondary">
					{initials || "?"}
				</div>
			)}
			<span className="truncate text-sm font-semibold text-text" title={playerName}>
				{playerName}
			</span>
		</div>
	);
}

const formatLockTime = (lockedAt: number | null) => {
	if (!lockedAt) return "Not locked";
	return new Date(lockedAt).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
};

function ThemeGuessCell({
	guess,
	correct,
}: {
	guess: string | null;
	correct: boolean | null;
}) {
	const label = guess?.trim() || "-";
	return (
		<div className="min-w-0">
			<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
				Theme guess
			</p>
			<div className="mt-0.5 flex min-w-0 items-center gap-2">
				<p className="truncate text-sm font-semibold text-text" title={guess ?? ""}>
					{label}
				</p>
				{correct !== null && (
					<span
						className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
							correct
								? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
								: "border-rose-500/35 bg-rose-500/10 text-rose-200"
						}`}
					>
						{correct ? "Correct" : "Wrong"}
					</span>
				)}
			</div>
		</div>
	);
}

function SongGuessStatsModal({
	onClose,
	playersByName,
	song,
	stats,
}: {
	onClose: () => void;
	playersByName: Map<string, Member>;
	song: Submission;
	stats: SongGuessStats;
}) {
	const titleId = useId();
	const correctCount = stats.correctGuessers.length;
	const correctGuessRows = stats.guessers.filter((guess) => guess.correct);
	const wrongGuessRows = stats.guessers.filter((guess) => !guess.correct);
	const hasThemeGuesses = stats.guessers.some((guess) => Boolean(guess.themeGuess?.trim()));
	const correctGuessRowGridClass = hasThemeGuesses
		? "md:grid-cols-[minmax(13rem,1.15fr)_minmax(9rem,0.85fr)_7rem]"
		: "md:grid-cols-[minmax(13rem,1.15fr)_7rem]";
	const wrongGuessRowGridClass = hasThemeGuesses
		? "md:grid-cols-[minmax(13rem,1.15fr)_minmax(9rem,0.85fr)_minmax(9rem,0.85fr)_7rem]"
		: "md:grid-cols-[minmax(13rem,1.15fr)_minmax(9rem,0.85fr)_7rem]";

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
			role="presentation"
			onMouseDown={onClose}
		>
			<section
				className="flex max-h-[min(42rem,calc(100vh-2rem))] w-full max-w-5xl flex-col rounded-lg border border-border bg-card text-text shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="border-b border-border/70 px-5 py-4">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-highlight">
						Song guesses
					</p>
					<h2 id={titleId} className="mt-1 truncate text-xl font-extrabold">
						{song.title || song.url}
					</h2>
					<p className="mt-1 text-sm text-text-muted">
						Submitted by <span className="font-semibold text-text">{song.submitter}</span>
					</p>
				</div>

				<div className="scrollbar-hidden min-h-0 overflow-y-auto px-5 py-4">
					<div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
						<ReactPlayer url={song.url} controls width="100%" height="100%" />
					</div>

					<div className="mt-4 grid gap-2 sm:grid-cols-2">
						<div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-3">
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
								Correct
							</p>
							<p className="mt-1 text-2xl font-extrabold text-emerald-100">
								{correctCount}/{stats.totalPlayers}
							</p>
						</div>
						<div className="rounded-lg border border-border/60 bg-black/15 px-3 py-3">
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
								Wrong
							</p>
							<p className="mt-1 text-2xl font-extrabold text-text">{stats.wrongCount}</p>
						</div>
					</div>

					<div className="mt-4">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
							Correct guesses
						</p>
						{correctCount > 0 ? (
							<div className="mt-2 grid gap-2">
								{correctGuessRows.map((guess, index) => (
									<div
										key={guess.playerName}
										className={`grid min-w-0 gap-3 rounded-lg border px-3 py-2 md:items-center ${correctGuessRowGridClass} ${
											guess.fastestCorrectLock
												? "border-emerald-500/40 bg-emerald-500/10"
												: "border-border/60 bg-black/15"
										}`}
									>
										<div className="min-w-0 flex-1">
											<div className="flex min-w-0 items-center gap-2">
												<span className="w-6 shrink-0 font-mono text-xs text-secondary">
													{index + 1}.
												</span>
												<PlayerAvatarBadge
													playerName={guess.playerName}
													player={playersByName.get(guess.playerName.toLowerCase())}
												/>
											</div>
											{guess.fastestCorrectLock && (
												<p className="mt-1 pl-8 text-xs font-semibold text-emerald-200 md:pl-8">
												Fastest correct lock
											</p>
										)}
									</div>
										{hasThemeGuesses && (
											<ThemeGuessCell guess={guess.themeGuess} correct={guess.themeCorrect} />
										)}
										<div className="shrink-0 text-left text-xs text-text-muted md:text-right">
											<p>{formatLockTime(guess.lockedAt)}</p>
											{guess.lockOrder != null && <p>Lock #{guess.lockOrder}</p>}
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="mt-2 rounded-lg border border-border/60 bg-black/15 px-3 py-4 text-sm text-text-muted">
								No players guessed this one correctly.
							</p>
						)}
					</div>

					{wrongGuessRows.length > 0 && (
						<div className="mt-4">
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
								Wrong guesses
							</p>
							<div className="mt-2 grid gap-2">
								{wrongGuessRows.map((guess, index) => (
									<div
										key={guess.playerName}
										className={`grid min-w-0 gap-3 rounded-lg border border-border/60 bg-black/15 px-3 py-2 md:items-center ${wrongGuessRowGridClass}`}
									>
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold text-text" title={guess.playerName}>
												{correctGuessRows.length + index + 1}. {guess.playerName}
											</p>
										</div>
										<div className="min-w-0">
											<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
												Song guess
											</p>
											<p className="truncate text-sm font-semibold text-text" title={guess.guess}>
												{guess.guess || "-"}
											</p>
										</div>
										{hasThemeGuesses && (
											<ThemeGuessCell guess={guess.themeGuess} correct={guess.themeCorrect} />
										)}
										<div className="shrink-0 text-left text-xs text-text-muted md:text-right">
											<p>{formatLockTime(guess.lockedAt)}</p>
											{guess.lockOrder != null && <p>Lock #{guess.lockOrder}</p>}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{stats.commonWrongGuesses.length > 0 && (
						<div className="mt-4">
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
								Common wrong guesses
							</p>
							<div className="mt-2 flex flex-wrap gap-2">
								{stats.commonWrongGuesses.map((entry) => (
									<span
										key={entry.guess}
										className="rounded-full border border-border/60 bg-black/15 px-3 py-1 text-sm font-medium text-text"
									>
										{entry.guess} x{entry.count}
									</span>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="flex justify-end gap-2 border-t border-border/70 px-5 py-4">
					<Button type="button" variant="secondary" size="sm" onClick={onClose}>
						Close
					</Button>
				</div>
			</section>
		</div>
	);
}

export default function HostPlaylistPanel({
	songs,
	roomOverride,
	revealedIds = [],
	currentSongId = null,
	onSelect,
	allPlayed: allPlayedProp,
	showSongDetails = false,
	showRevealControls = true,
	useSongArtworkBackground,
	onToggleSongArtworkBackground,
}: HostPlaylistPanelProps) {
	const socket = useSocket();
	const { room } = useRoomState();
	const viewRoom = roomOverride ?? room;
	const [guessStats, setGuessStats] = useState<SongGuessStats[]>([]);
	const [selectedStatsSong, setSelectedStatsSong] = useState<Submission | null>(null);
	const canReveal = Boolean(allPlayedProp);
	const hasDetailQuestion = !!viewRoom?.detailQuestion;
	const hideSubmitterInPlaylist = viewRoom?.phase === "REVEAL" || viewRoom?.phase === "RESULTS";
	const canShowGuessStats = viewRoom?.phase === "ENDED";
	const guessStatsBySongId = useMemo(() => {
		const map = new Map<number, SongGuessStats>();
		for (const stats of guessStats) map.set(stats.songId, stats);
		return map;
	}, [guessStats]);
	const playersByName = useMemo(() => {
		const map = new Map<string, Member>();
		for (const player of viewRoom?.players ?? []) map.set(player.name.toLowerCase(), player);
		return map;
	}, [viewRoom?.players]);
	const selectedStats =
		selectedStatsSong == null ? null : (guessStatsBySongId.get(selectedStatsSong.id) ?? null);
	const playlistReveals = useHostPlaylistReveals({
		canReveal,
		room: viewRoom,
		songs,
	});
	const showSubmitterRevealButton = !playlistReveals.allSubmittersRevealed;
	const showDetailRevealButton = hasDetailQuestion && !playlistReveals.allDetailAnswersRevealed;

	useEffect(() => {
		if (!viewRoom || !canShowGuessStats) {
			setGuessStats([]);
			setSelectedStatsSong(null);
			return;
		}

		socket.emit("getSongGuessStats", { code: viewRoom.code }, (response) => {
			if (!response.ok) return;
			setGuessStats(response.stats);
		});
	}, [canShowGuessStats, socket, viewRoom?.code, viewRoom]);

	// ---- it's safe to early-return after hooks ----
	if (!viewRoom) return null;
	const footer =
		showRevealControls && (showSubmitterRevealButton || showDetailRevealButton) ? (
			<div
				className={`grid gap-2 ${
					showSubmitterRevealButton && showDetailRevealButton ? "grid-cols-2" : "grid-cols-1"
				}`}
			>
				{showSubmitterRevealButton && (
					<Button
						variant="primary"
						size="md"
						onClick={playlistReveals.revealNextSubmitter}
						disabled={!canReveal}
						className="w-full min-w-0 px-2 text-xs leading-tight sm:text-sm"
					>
						{`Reveal submitter #${playlistReveals.nextSubmitterSongNumber ?? ""}`}
					</Button>
				)}
				{showDetailRevealButton && (
					<Button
						variant="secondary"
						size="md"
						onClick={playlistReveals.revealNextDetailAnswer}
						disabled={!canReveal}
						className="w-full min-w-0 px-2 text-xs leading-tight sm:text-sm"
					>
						{`Reveal answer #${playlistReveals.nextDetailSongNumber ?? ""}`}
					</Button>
				)}
			</div>
		) : showRevealControls &&
			  canReveal &&
			  playlistReveals.allSubmittersRevealed &&
			  (!hasDetailQuestion || playlistReveals.allDetailAnswersRevealed) ? (
			<p className="text-xs sm:text-sm text-text-muted text-center">All submitters revealed.</p>
		) : null;

	return (
		<PlaylistSidebar
			onToggleSongArtworkBackground={onToggleSongArtworkBackground}
			useSongArtworkBackground={useSongArtworkBackground}
			footer={footer}
		>
			<>
				{songs.map((song, index) => (
					<HostPlaylistSongRow
						key={song.id}
						hasDetailQuestion={hasDetailQuestion}
						index={index}
						isCurrent={currentSongId === song.id}
						isDetailRevealed={
							showSongDetails || playlistReveals.revealedDetailAnswers.includes(song.id)
						}
						isSubmitterRevealed={
							!hideSubmitterInPlaylist &&
							(showSongDetails || playlistReveals.revealedSubmitters.includes(song.id))
						}
						isTitleRevealed={showSongDetails || revealedIds.includes(song.id)}
						guessStats={canShowGuessStats ? guessStatsBySongId.get(song.id) : undefined}
						onOpenGuessStats={canShowGuessStats ? setSelectedStatsSong : undefined}
						onSelect={onSelect}
						song={song}
					/>
				))}
			</>
			{selectedStatsSong && selectedStats && (
				<SongGuessStatsModal
					onClose={() => setSelectedStatsSong(null)}
					playersByName={playersByName}
					song={selectedStatsSong}
					stats={selectedStats}
				/>
			)}
		</PlaylistSidebar>
	);
}
