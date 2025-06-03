"use client";
// src/components/HostGameClient.tsx

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Player, Room, Song } from "@/types/room";
import ReactPlayer from "react-player";
import Button from "./ui/Button";
import { getYouTubeID } from "@/lib/youtube";

export default function HostGameClient({ code }: { code: string }) {
	const socket = useSocket();
	const { state, dispatch } = useGame();
	// Holds the currently playing Song (or null if none)
	const [currentSong, setCurrentSong] = useState<Song | null>(null);
	// Whether to reveal the current clip’s submitter name
	const [showSubmitter, setShowSubmitter] = useState(false);
	// Keeps track of which song IDs have been revealed (for the playlist buttons)
	const [revealedSongs, setRevealedSongs] = useState<number[]>([]);
	// Keeps track of which player have been revealed (for the ranking list)
	const [revealedRanking, setRevealedRanking] = useState<number[]>([]);
	// NEW: which players have submitted
	const [submittedPlayers, setSubmittedPlayers] = useState<string[]>([]);
	// NEW: background‐image URL (room.backgroundUrl OR current thumbnail)
	const [bgThumbnail, setBgThumbnail] = useState<string | null>(null);

	const hasJoined = useRef(false);

	// 1) On game start, seed context
	useEffect(() => {
		const onGameStarted = (room: Room) => {
			dispatch({ type: "SET_ROOM", room });
			dispatch({ type: "START_GAME" });
			setBgThumbnail(null);
		};
		socket.on("gameStarted", onGameStarted);
		return () => {
			socket.off("gameStarted", onGameStarted);
		};
	}, [socket, dispatch]);

	// 2) Listen for new players joining (so host sees updated player list)
	useEffect(() => {
		hasJoined.current = true; // Mark as joined

		// 2) Register listeners without blocking on hasJoined
		socket.on("playerJoined", (player: Player) => {
			dispatch({ type: "ADD_PLAYER", player });
		});

		return () => {
			socket.off("playerJoined");
		};
	}, [socket, dispatch, state.room]);

	// 3) On each playSong, update clip locally and in context
	useEffect(() => {
		const onPlaySong = ({ songId, clipUrl }: { songId: number; clipUrl: string }) => {
			// update context currentClip
			dispatch({ type: "PLAY_SONG", payload: { songId, clipUrl } });
			// reset reveal
			setShowSubmitter(false);
			// find full song object
			const s = state.room?.songs.find((x) => x.id === songId) || null;
			setCurrentSong(s);

			// 3d) pull the YouTube ID out of clipUrl and build a thumbnail URL
			const vidId = getYouTubeID(clipUrl);
			if (vidId) {
				setBgThumbnail(`https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`);
			} else {
				setBgThumbnail(null);
			}
		};

		socket.on("playSong", onPlaySong);
		return () => {
			socket.off("playSong", onPlaySong);
		};
	}, [socket, dispatch, state.room]);

	// 4) Listen for "playerSubmitted" (NEW). Whenever a player submits, add their name here.
	useEffect(() => {
		const onPlayerSubmitted = ({ playerName }: { playerName: string }) => {
			setSubmittedPlayers((prev) => (prev.includes(playerName) ? prev : [...prev, playerName]));
		};
		socket.on("playerSubmitted", onPlayerSubmitted);
		return () => {
			socket.off("playerSubmitted", onPlayerSubmitted);
		};
	}, [socket]);

	// 5) Listen for "gameOver" so Host can render the leaderboard
	useEffect(() => {
		const onGameOver = ({ scores }: { scores: Record<string, number> }) => {
			dispatch({ type: "GAME_OVER", payload: { scores } });
		};
		socket.on("gameOver", onGameOver);
		return () => {
			socket.off("gameOver", onGameOver);
		};
	}, [socket, dispatch]);

	// 6) Host clicks a song → emit "playSong"
	const handlePlay = (song: Song) => {
		socket.emit("playSong", { code, songId: song.id }, (res: { success: boolean; error?: string }) => {
			if (!res.success) {
				alert("Could not play that song: " + res.error);
			} else {
				setRevealedSongs((prev) => (prev.includes(song.id) ? prev : [...prev, song.id]));
			}
		});
	};

	// 7) Host clicks "Show Results" → emit "showResults"
	const handleShowResults = () => {
		socket.emit("showResults", { code }, (ok: boolean) => {
			if (!ok) alert("Failed to show results");
		});
	};

	// If we haven’t joined a room or the game hasn’t started yet:
	if (!state.room || !state.gameStarted) {
		return <p>Loading game…</p>;
	}

	// Build a sorted ranking of [playerName, points], or empty array if no scores yet
	const ranking: [string, number][] = state.scores
		? (Object.entries(state.scores) as [string, number][]).sort(([, a], [, b]) => b - a)
		: [];

	return (
		<div
			className="
        min-h-screen p-8 
        bg-gradient-to-br from-bg to-secondary 
        bg-no-repeat bg-cover bg-center
      "
			style={{
				// Use the thumbnail if set; otherwise fall back to the room’s background
				backgroundImage: bgThumbnail ? `url(${bgThumbnail})` : `url(${state.room.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			<div className="max-w-7xl mx-auto bg-card bg-opacity-60 border border-border rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row overflow-hidden">
				{/** ========== LEFT SIDEBAR ========== **/}
				<aside className="w-full lg:w-1/4 p-8 border-r border-border flex flex-col items-center">
					<h1 className="text-3xl font-bold text-text mb-4">
						Guess <span className="text-secondary underline decoration-highlight">the</span> Song
					</h1>
					<div className="bg-card bg-opacity-50 border border-border rounded-lg p-4 text-center mb-6">
						<p className="text-text-muted text-sm">Room code</p>
						<p className="text-4xl font-mono font-bold text-secondary">{state.room.code}</p>
					</div>
					<ul className="space-y-2 w-full">
						{state.room.players.map((p) => {
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
					{state.scores ? (
						// -------- Top-3 Leaderboard (Game Over) --------
						<>
							<h2 className="text-2xl font-semibold text-text mb-4">Final Results</h2>
							<div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md">
								{ranking.slice(0, 3).map(([name, pts]: [string, number], idx: number) => {
									const isRevealed = revealedRanking.includes(idx);
									return (
										<div
											key={name}
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
														#{idx + 1} {name}
													</span>
													<span className="text-text font-medium">{pts} pts</span>
												</>
											) : (
												<span className="text-text italic">
													#{idx + 1} Click to reveal
												</span>
											)}
										</div>
									);
								})}
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
						{state.room.songs.map((s) => (
							<Button
								key={s.id}
								variant={currentSong?.id === s.id ? "primary" : "secondary"}
								size="sm"
								className="w-full justify-start"
								onClick={() => handlePlay(s)}
							>
								{revealedSongs.includes(s.id) ? s.title ?? s.url : "Click to reveal song"}
							</Button>
						))}
					</div>
				</aside>
			</div>
		</div>
	);
}
