"use client";
// src/components/HostLobbyClient.tsx

import { useEffect, useRef, useState } from "react";
import SongSubmitForm from "./SongSubmitForm";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/tempContext";
import { Player, Room, Song } from "@/types/room";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import ReactPlayer from "react-player";
import PlayerList from "./PlayerList";

export default function HostLobbyClient({ initialRoom }: { initialRoom: Room }) {
	const socket = useSocket();
	const router = useRouter();
	const hasJoined = useRef(false);
	const {
		room,
		setRoom,
		addPlayer,
		addSong,
		removeSong,
		setGameStarted,
		submittedPlayers,
		setSubmittedPlayers,
	} = useGame();

	const [previewUrl, setPreviewUrl] = useState<string>("");
	const [revealedId, setRevealedId] = useState<number | null>(null);
	const [socketError, setSocketError] = useState<string | null>(null);
	const [playerLeftMessage, setPlayerLeftMessage] = useState<string | null>(null);

	const roomCodeRef = useRef(initialRoom.code);

	useEffect(() => {
		setRoom(initialRoom);

		if (!hasJoined.current) {
			socket.emit("joinRoom", { code: initialRoom.code, name: "Host" }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join socket room");
			});
			hasJoined.current = true;
		}

		socket.on("playerJoined", (player: Player) => addPlayer(player));
		socket.on("songAdded", (song: Song) => addSong(song));
		socket.on("songRemoved", ({ songId }: { songId: number }) => removeSong(songId));

		return () => {
			socket.off("songAdded");
			socket.off("songRemoved");
			socket.off("playerJoined");
		};
	}, [socket, setRoom, addPlayer, addSong, removeSong, initialRoom]);

	useEffect(() => {
		const onDisconnect = (reason: any) => {
			console.warn("⚠️ socket disconnected:", reason);
			setSocketError("Connection lost. Reconnecting…");
		};

		const onReconnect = (attempt?: number) => {
			console.log("✅ socket reconnected", attempt ? `(attempt #${attempt})` : "");
			setSocketError(null);
			socket.emit("joinRoom", { code: roomCodeRef.current, name: "Host" }, (ok: boolean) => {
				console.log("re-join ack:", ok);
			});
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
			mgr.off("reconnect", () => onReconnect);
		};
	}, [socket]);

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

	if (!room) return <p>Loading lobby…</p>;

	const startGame = () => {
		socket.emit("startGame", { code: room.code }, (ok: boolean) => {
			if (!ok) return alert("Could not start game");
			router.push(`/host/${room.code}/game`);
			setGameStarted(true);
		});
	};

	return (
		<div
			className="
        min-h-screen p-8
        bg-gradient-to-br from-bg to-secondary
        bg-no-repeat bg-cover bg-center
        flex items-center justify-center
      "
			style={{
				backgroundImage: `url(${room.backgroundUrl})`,
				backgroundBlendMode: "overlay",
			}}
		>
			{socketError && (
				<div className="fixed top-0 left-0 w-full bg-yellow-300 text-yellow-900 text-center py-2 z-50">
					{socketError}
				</div>
			)}
			<div
				className="
          w-[90vw] max-w-screen-xl
          bg-card bg-opacity-60 border border-border
          rounded-2xl backdrop-blur-xl
          flex flex-col lg:flex-row overflow-hidden
          h-[80vh]
        "
			>
				{/* Left sidebar */}
				<aside className="flex-1 p-8 border-r border-border flex flex-col items-center h-full">
					<h1 className="text-3xl font-bold text-text mb-4 text-center">
						Guess <span className="text-secondary underline decoration-highlight">the</span> Song
					</h1>
					<div className="bg-card bg-opacity-50 border border-border rounded-lg p-4 text-center mb-6 w-full">
						<p className="text-text-muted text-sm">Room code</p>
						<p className="text-4xl font-mono font-bold text-secondary">{room.code}</p>
					</div>
					<p className="text-text-muted mb-4">Waiting for players…</p>
					<PlayerList
						players={room.players}
						submittedPlayers={submittedPlayers}
						className="w-full"
					/>
				</aside>

				{/* Center panel */}
				<main className="flex-2 p-8 flex flex-col justify-between h-full">
					{playerLeftMessage && (
						<div className="fixed top-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded shadow transition-opacity duration-300 opacity-100">
							{playerLeftMessage}
						</div>
					)}
					<div>
						<h2 className="text-3xl font-semibold text-text mb-6">Song Setup</h2>
						{/* pass our setter down so the form can tell us current URL */}
						<SongSubmitForm code={room.code} onUrlChange={setPreviewUrl} />

						{/* Always-shown preview player, taller and spaced further down */}
						<div className="w-full rounded-lg overflow-hidden border border-border mt-12 mb-6 h-96">
							<ReactPlayer url={previewUrl} controls width="100%" height="100%" />
						</div>
					</div>

					{/* Start button pinned to bottom */}
					<div className="mt-4">
						<Button
							onClick={startGame}
							variant="primary"
							size="lg"
							className="w-full py-4 text-2xl"
						>
							Start Game
						</Button>
					</div>
				</main>

				{/* Right sidebar */}
				<aside className="flex-1 p-6 border-l border-border flex flex-col h-full">
					<h2 className="text-xl font-semibold text-text mb-4">Playlist</h2>
					<div className="bg-card bg-opacity-50 border border-border rounded-lg divide-y divide-border overflow-auto mt-6">
						{room.songs.map((s, i) => {
							const isRevealed = revealedId === s.id;
							return (
								<div
									key={s.id}
									// clicking the row toggles reveal
									onClick={() => setRevealedId(isRevealed ? null : s.id)}
									className="relative flex items-center px-4 py-3 hover:bg-card hover:bg-opacity-30 cursor-pointer transition"
								>
									{/* badge + (maybe) details */}
									<div className="flex items-start space-x-3 flex-1">
										<div className="items-center justify-center font-semibold">
											{i + 1}
										</div>
										{isRevealed && (
											<div className="flex flex-col">
												<span className="font-semibold text-text">{s.title}</span>
												<span className="text-sm text-text-muted">
													Submitted by {s.submitter}
												</span>
											</div>
										)}
									</div>

									{/* Remove button only if revealed */}
									{isRevealed && (
										<button
											onClick={(e) => {
												e.stopPropagation(); // don’t re-toggle when removing
												socket.emit(
													"removeSong",
													{ code: room!.code, songId: s.id },
													(res: { success: boolean; error?: string }) => {
														if (!res.success)
															return alert(
																"Could not remove song: " + res.error
															);
													}
												);
											}}
											className="absolute top-0 right-0 text-red-500 hover:text-red-400 p-1 text-lg leading-none"
											aria-label="Remove song"
										>
											X
										</button>
									)}
								</div>
							);
						})}
					</div>
				</aside>
			</div>
		</div>
	);
}
