"use client";
// src/components/HostGameClient.tsx

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Player, Room, Song } from "@/types/room";
import ReactPlayer from "react-player";
import Button from "./ui/Button";
import { getYouTubeID } from "@/lib/youtube";
import { useGame } from "../contexts/tempContext";
import PlayerList from "./PlayerList";

export default function HostGameClient({ code }: { code: string }) {
	const socket = useSocket();
	const {
		room,
		setRoom,
		gameStarted,
		setGameStarted,
		setCurrentClip,
		scores,
		setScores,
		revealedSongs,
		setRevealedSongs,
		addPlayer,
		currentSong,
		setCurrentSong,
		submittedPlayers,
		setSubmittedPlayers,
		bgThumbnail,
		setBgThumbnail,
	} = useGame();

	const [showSubmitter, setShowSubmitter] = useState(false);
	const [revealedRanking, setRevealedRanking] = useState<number[]>([]);
	const [socketError, setSocketError] = useState<string | null>(null);
	const [playerLeftMessage, setPlayerLeftMessage] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const roomCodeRef = useRef(code);
	const hasJoined = useRef(false);

	useEffect(() => {
		const onGameStarted = (roomData: Room) => {
			setRoom(roomData);
			setGameStarted(true);
			setBgThumbnail(null);
		};
		socket.on("gameStarted", onGameStarted);

		return () => {
			socket.off("gameStarted", onGameStarted);
		};
	}, [socket, setRoom, setGameStarted, setBgThumbnail]);

	// Handle player joining
	useEffect(() => {
		socket.on("playerJoined", (player: Player) => addPlayer(player));
		return () => {
			socket.off("playerJoined");
		};
	}, [socket, addPlayer]);

	// Handle player leaving
	useEffect(() => {
		socket.on("playerLeft", (playerId: number) => {
			setRoom((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					players: prev.players.filter((p) => p.id !== playerId),
				};
			});

			const leftPlayer = room?.players.find((p) => p.id === playerId);
			if (leftPlayer) {
				console.log(`💬 ${leftPlayer.name} left the game`);
				setPlayerLeftMessage(`${leftPlayer.name} left the game`);
				setTimeout(() => setPlayerLeftMessage(null), 4000);
			}
		});

		return () => {
			socket.off("playerLeft");
		};
	}, [socket, room, setRoom]);

	useEffect(() => {
		const onDisconnect = (reason: any) => {
			console.warn("⚠️ socket disconnected:", reason);
			setSocketError("Connection lost. Reconnecting…");
		};
		const onReconnect = (attempt?: number) => {
			console.log("✅ socket reconnected", attempt ? `(attempt #${attempt})` : "");
			setSocketError(null);
			socket.emit("joinRoom", { code: roomCodeRef.current, name: "Host" }, () => {});
		};

		socket.on("disconnect", onDisconnect);
		socket.on("connect", () => onReconnect());
		socket.on("reconnect", onReconnect);

		const mgr = (socket as any).io;
		mgr.on("connect", () => onReconnect());
		mgr.on("reconnect", onReconnect);

		return () => {
			socket.off("disconnect", onDisconnect);
			socket.off("connect", () => onReconnect());
			socket.off("reconnect", onReconnect);
			mgr.off("connect", () => onReconnect());
			mgr.off("reconnect", onReconnect);
		};
	}, [socket]);

	useEffect(() => {
		const onPlaySong = ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			setCurrentClip({ songId, clipUrl });
			setShowSubmitter(false);
			const s = room?.songs.find((x) => x.id === songId) || null;
			setCurrentSong(s);
			const vidId = getYouTubeID(clipUrl);
			setBgThumbnail(vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : null);
			setIsPlaying(true); // 🔊 ensure autoplay when host changes track
		};
		socket.on("playSong", onPlaySong);
		return () => {
			socket.off("playSong", onPlaySong);
		};
	}, [socket, setCurrentClip, room, setBgThumbnail, setCurrentSong]);

	useEffect(() => {
		const onPlayerSubmitted = ({ playerName }: { playerName: string }) => {
			setSubmittedPlayers((prev) => (prev.includes(playerName) ? prev : [...prev, playerName]));
		};
		socket.on("playerSubmitted", onPlayerSubmitted);
		return () => {
			socket.off("playerSubmitted", onPlayerSubmitted);
		};
	}, [socket, setSubmittedPlayers]);

	useEffect(() => {
		const onGameOver = ({ scores }: { scores: Record<string, number> }) => {
			setScores(scores);
		};
		socket.on("gameOver", onGameOver);
		return () => {
			socket.off("gameOver", onGameOver);
		};
	}, [socket, setScores]);

	const handlePlay = (song: Song) => {
		socket.emit("playSong", { code, songId: song.id }, (res: { success: boolean }) => {
			if (!revealedSongs.includes(song.id)) {
				const updated = [...revealedSongs, song.id];
				setRevealedSongs(updated);

				// ✅ Broadcast to others
				socket.emit("revealedSongs", { code, revealed: updated });
			}
		});
	};

	// Derive current index from context state
	const currentIndex = currentSong ? room?.songs.findIndex((s) => s.id === currentSong.id) ?? -1 : -1;
	// How many songs we have and how many are played at least once
	const totalSongs = room?.songs.length ?? 0;
	const allPlayed = totalSongs > 0 && room!.songs.every((s) => revealedSongs.includes(s.id)); // show only after each song got played once

	// Centralized play helper that reuses your socket flow + revealed sync
	const playAtIndex = (idx: number) => {
		if (!room?.songs[idx]) return;
		const song = room.songs[idx];

		socket.emit("playSong", { code, songId: song.id }, () => {
			if (!revealedSongs.includes(song.id)) {
				const updated = [...revealedSongs, song.id];
				setRevealedSongs(updated);
				socket.emit("revealedSongs", { code, revealed: updated });
			}
		});

		setIsPlaying(true);
	};

	const handlePrev = () => {
		if (currentIndex <= 0) return;
		playAtIndex(currentIndex - 1);
	};

	const handleNext = () => {
		if (currentIndex === -1) return;
		if (currentIndex >= (room?.songs.length ?? 0) - 1) return;
		playAtIndex(currentIndex + 1);
	};

	const handlePlayPause = () => {
		if (!currentSong) {
			// First-ever press: start from the first song
			playAtIndex(0);
			return;
		}
		setIsPlaying((p) => !p);
	};

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

			if (e.code === "Space") {
				e.preventDefault();
				handlePlayPause();
			}
			if (e.code === "ArrowLeft") handlePrev();
			if (e.code === "ArrowRight") handleNext();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [currentIndex, room, isPlaying]);

	const handleShowResults = () => {
		socket.emit("showResults", { code }, (ok: boolean) => {
			if (!ok) alert("Failed to show results");
		});
	};

	if (!room || !gameStarted) return <p>Loading game…</p>;

	return (
		<div
			className="min-h-screen
			p-4 sm:p-6 lg:p-8       
			bg-gradient-to-br from-bg to-secondary
			bg-no-repeat bg-cover bg-center"
			style={{
				// Use the thumbnail if set; otherwise fall back to the room’s background
				backgroundImage: bgThumbnail ? `url(${bgThumbnail})` : `url(${room.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			{socketError && (
				<div className="fixed top-0 left-0 w-full bg-yellow-300 text-yellow-900 text-center py-2 z-50">
					{socketError}
				</div>
			)}
			<div
				className="w-full max-w-none
				bg-card/60 border border-border rounded-2xl backdrop-blur-xl
				grid grid-cols-1 lg:grid-cols-12
				overflow-hidden"
			>
				{/** ========== LEFT SIDEBAR ========== **/}
				<aside
					className="order-1 lg:order-none
					w-full lg:col-span-3
					p-4 sm:p-6
					border-b lg:border-b-0 lg:border-r border-border
					flex flex-col items-center"
				>
					<h1
						className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight
						text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400
						drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] leading-[1.15] pb-6 sm:pb-8"
					>
						Guess the song
					</h1>
					<div className="bg-card/50 border border-border rounded-lg p-3 sm:p-4 text-center mb-4 sm:mb-6 w-full">
						<p className="text-text-muted text-xs sm:text-sm">Room code</p>
						<p className="text-3xl sm:text-4xl font-mono font-bold text-secondary">{room.code}</p>
					</div>
					<div className="w-full max-h-48 sm:max-h-64 lg:max-h-none overflow-y-auto">
						<PlayerList
							players={room.players}
							submittedPlayers={submittedPlayers}
							className="w-full"
						/>
					</div>
				</aside>

				{/** ========== CENTER PANEL ========== **/}
				<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
					{playerLeftMessage && (
						<div className="fixed top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded shadow">
							{playerLeftMessage}
						</div>
					)}

					{scores ? (
						// -------- Top-3 Leaderboard (Game Over) --------
						<>
							<h2 className="text-xl sm:text-2xl font-semibold text-text mb-3 sm:mb-4">
								Final Results
							</h2>
							<div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xl w-full max-w-md">
								{(() => {
									if (!scores) return null;

									const ranking: [string, number][] = Object.entries(scores).sort(
										([, a], [, b]) => b - a
									);

									// Step 1: Group players by score
									const grouped: { score: number; names: string[] }[] = [];
									for (const [name, score] of ranking) {
										const existing = grouped.find((g) => g.score === score);
										if (existing) {
											existing.names.push(name);
										} else {
											grouped.push({ score, names: [name] });
										}
									}

									// Step 2: Render grouped leaderboard with rank numbers
									return grouped.slice(0, 3).map((group, idx) => {
										const isRevealed = revealedRanking.includes(idx);

										return (
											<div
												key={group.score}
												className="flex justify-between py-2 border-b border-border last:border-b-0 cursor-pointer"
												onClick={() => {
													if (!isRevealed) {
														setRevealedRanking((prev) => [...prev, idx]);
													}
												}}
											>
												{isRevealed ? (
													<>
														<span className="text-text">
															#{idx + 1} {group.names.join(", ")}
														</span>
														<span className="text-text font-medium">
															{group.score} pts
														</span>
													</>
												) : (
													<span className="text-text italic">
														#{idx + 1} Click to reveal
													</span>
												)}
											</div>
										);
									});
								})()}
							</div>
						</>
					) : (
						// -------- In-Progress (ReactPlayer + “Show Results”) --------
						<>
							<h2
								className="text-lg sm:text-2xl font-semibold text-text cursor-pointer select-none"
								onClick={() => setShowSubmitter(true)}
							>
								{showSubmitter && currentSong
									? currentSong.submitter
									: "Click to reveal submitter"}
							</h2>

							<div className="w-full mt-4 mb-4 sm:mt-6 sm:mb-6">
								<div className="rounded-lg overflow-hidden border border-border aspect-video">
									{currentSong ? (
										<ReactPlayer
											url={currentSong.url}
											controls
											playing={isPlaying && !!currentSong}
											width="100%"
											height="100%"
											// ReactPlayer also supports style={{ aspectRatio: '16/9' }} as a fallback
										/>
									) : (
										<div className="w-full h-full grid place-items-center bg-black/80 text-text-muted">
											<div className="text-center px-4">
												<p className="text-base sm:text-lg">No song selected</p>
												<p className="text-xs sm:text-sm opacity-80">
													Press <span className="font-medium">Play</span> to start
													with track 1
												</p>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Playback controls */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-3 w-full max-w-md mx-auto">
								<Button
									variant="secondary"
									size="md"
									onClick={handlePrev}
									disabled={!currentSong || currentIndex <= 0}
									className="w-full sm:flex-1 text-center"
								>
									◀ Previous
								</Button>

								<Button
									variant="primary"
									size="md"
									onClick={handlePlayPause}
									aria-keyshortcuts="Space"
									aria-label="Play/Pause (Space)"
									className="w-full sm:flex-1 text-center"
								>
									{isPlaying ? "Pause" : currentSong ? "Play" : "Play • Start Track 1"}
								</Button>

								<Button
									variant="secondary"
									size="md"
									onClick={handleNext}
									disabled={!currentSong || currentIndex === (room?.songs.length ?? 0) - 1}
									className="w-full sm:flex-1 text-center"
								>
									Next ▶
								</Button>
							</div>

							{/* Small indicator which displays how many songs have been played */}
							{!allPlayed && (
								<p className="mt-3 sm:mt-4 text-xs sm:text-sm text-text-muted">
									Played{" "}
									{
										revealedSongs.filter((id) => room?.songs.some((s) => s.id === id))
											.length
									}
									/{totalSongs}
								</p>
							)}
							{/* Only show when all songs have been played at least once */}
							{allPlayed && (
								<div className="flex gap-4 mt-3 sm:mt-4">
									<Button variant="secondary" size="md" onClick={handleShowResults}>
										Show Results
									</Button>
								</div>
							)}
						</>
					)}
				</main>

				{/* Right sidebar */}
				<aside
					className="order-2 lg:order-none
					w-full lg:col-span-3
					p-4 sm:p-6
					border-t lg:border-t-0 lg:border-l border-border
					flex flex-col"
				>
					<h2 className="text-lg sm:text-xl font-semibold text-text mb-3 sm:mb-4">Playlist</h2>
					<div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto max-h-56 sm:max-h-72 lg:max-h-none">
						{room.songs.map((s, idx) => (
							<Button
								key={s.id}
								variant={currentSong?.id === s.id ? "primary" : "secondary"}
								size="sm"
								className="w-full justify-start"
								onClick={() => handlePlay(s)}
							>
								<div className="flex items-center gap-2 w-full text-left">
									<span className="font-mono text-secondary">{idx + 1}.</span>
									<span>
										{revealedSongs.includes(s.id)
											? s.title ?? s.url
											: "Click to reveal song"}
									</span>
								</div>
							</Button>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}
