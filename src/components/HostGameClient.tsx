"use client";
// src/components/HostGameClient.tsx

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Player, Room, Song } from "@/types/room";
import ReactPlayer from "react-player";
import Button from "./ui/Button";
import { getYouTubeID } from "@/lib/youtube";
import { useGame } from "../contexts/GameContext";

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

	useEffect(() => {
		hasJoined.current = true;
		socket.on("playerJoined", (player: Player) => addPlayer(player));
		return () => {
			socket.off("playerJoined");
		};
	}, [socket, addPlayer]);

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

	const handleShowResults = () => {
		socket.emit("showResults", { code }, (ok: boolean) => {
			if (!ok) alert("Failed to show results");
		});
	};

	if (!room || !gameStarted) return <p>Loading game…</p>;

	return (
		<div
			className="
        min-h-screen p-8 
        bg-gradient-to-br from-bg to-secondary 
        bg-no-repeat bg-cover bg-center
      "
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
			<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
				{/** ========== LEFT SIDEBAR ========== **/}
				<aside className="w-full lg:w-1/4 p-8 border-r border-border flex flex-col items-center">
					<h1 className="text-3xl font-bold text-text mb-4">
						Guess <span className="text-secondary underline decoration-highlight">the</span> Song
					</h1>
					<div className="bg-card bg-opacity-50 border border-border rounded-lg p-4 text-center mb-6">
						<p className="text-text-muted text-sm">Room code</p>
						<p className="text-4xl font-mono font-bold text-secondary">{room.code}</p>
					</div>
					<ul className="space-y-2 w-full">
						{room.players.map((p) => {
							const didSubmit = submittedPlayers.includes(p.name);
							return (
								<li key={p.id} className="flex items-center space-x-2 text-text">
									<span
										className={`w-3 h-3 rounded-full ${
											didSubmit ? "bg-green-500" : "bg-primary"
										}`}
									/>
									<span>{p.name}</span>
								</li>
							);
						})}
					</ul>
				</aside>

				{/** ========== CENTER PANEL ========== **/}
				<main className="flex-1 p-6 flex flex-col items-center">
					{scores ? (
						// -------- Top-3 Leaderboard (Game Over) --------
						<>
							<h2 className="text-2xl font-semibold text-text mb-4">Final Results</h2>
							<div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md">
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
								className="text-2xl font-semibold text-text cursor-pointer select-none"
								onClick={() => setShowSubmitter(true)}
							>
								{showSubmitter && currentSong
									? currentSong.submitter
									: "Click to reveal submitter"}
							</h2>

							<div className="w-full rounded-lg overflow-hidden border border-border mt-6 mb-6 h-96">
								{currentSong ? (
									<ReactPlayer
										url={currentSong.url}
										controls
										playing
										width="100%"
										height="100%"
									/>
								) : (
									<div className="w-full h-full bg-[#000]" />
								)}
							</div>

							<div className="flex gap-4">
								<Button variant="secondary" size="md" onClick={handleShowResults}>
									Show Results
								</Button>
							</div>
						</>
					)}
				</main>

				{/* Right sidebar */}
				<aside className="w-1/4 p-6 border-l border-border flex flex-col">
					<h2 className="text-xl font-semibold text-text mb-4">Playlist</h2>
					<div className="space-y-3 flex-1 overflow-y-auto">
						{room.songs.map((s, idx) => (
							<Button
								key={s.id}
								variant={currentSong?.id === s.id ? "primary" : "secondary"}
								size="sm"
								className="w-full justify-start"
								onClick={() => handlePlay(s)}
							>
								<div className="flex items-center space-x-2 w-full text-left">
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
