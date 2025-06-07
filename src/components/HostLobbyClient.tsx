"use client";
// src/components/HostLobbyClient.tsx

import { useEffect, useRef, useState } from "react";
import SongSubmitForm from "./SongSubmitForm";
import { useSocket } from "@/contexts/SocketContext";
import { useGame } from "@/contexts/GameContext";
import { Player, Room, Song } from "@/types/room";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import ReactPlayer from "react-player";

export default function HostLobbyClient({ initialRoom }: { initialRoom: Room }) {
	const socket = useSocket();
	const router = useRouter();
	const hasJoined = useRef(false);
	const { state, dispatch } = useGame();
	const [previewUrl, setPreviewUrl] = useState<string>("");
	const [revealedId, setRevealedId] = useState<number | null>(null);
	const [socketError, setSocketError] = useState<string | null>(null);

	// keep the room code in a ref so our reconnect handler can access it
	const roomCodeRef = useRef(initialRoom.code);

	// ─── seed + game logic ─────────────────────────────────────────
	useEffect(() => {
		// seed the entire room (players + songs) in one go
		dispatch({ type: "SET_ROOM", room: initialRoom });

		// only join the socket once
		if (!hasJoined.current) {
			socket.emit("joinRoom", { code: initialRoom.code, name: "Host" }, (ok: boolean) => {
				if (!ok) console.error("❌ Failed to join socket room");
			});
			hasJoined.current = true;
		}

		// 3) Register listeners without blocking on hasJoined
		socket.on("playerJoined", (player: Player) => {
			dispatch({ type: "ADD_PLAYER", player });
		});

		// when someone adds a song
		socket.on("songAdded", (song: Song) => {
			dispatch({ type: "ADD_SONG", song });
		});

		// when someone (host) removes a song
		socket.on("songRemoved", ({ songId }: { songId: number }) => {
			dispatch({ type: "REMOVE_SONG", songId });
		});

		return () => {
			socket.off("songAdded");
			socket.off("songRemoved");
			socket.off("playerJoined");
		};
	}, [socket, dispatch, initialRoom]);

	// ─── CONNECTION / RECONNECT EFFECT ─────────────────────────────
	useEffect(() => {
		const onDisconnect = (reason: any) => {
			console.warn("⚠️ socket disconnected:", reason);
			setSocketError("Connection lost. Reconnecting…");
		};

		const onReconnect = (attempt?: number) => {
			console.log("✅ socket reconnected", attempt ? `(attempt #${attempt})` : "");
			setSocketError(null);
			socket.emit("joinRoom", { code: roomCodeRef.current, name: "Host" }, (ok: boolean) => {
				// you can ignore the result on reconnect
				console.log("re-join ack:", ok);
			});
		};

		// 1) socket-level events
		socket.on("disconnect", onDisconnect);
		socket.on("connect", () => onReconnect());
		socket.on("reconnect", onReconnect);

		// 2) manager-level events (under the hood)
		const mgr = (socket as any).io;
		mgr.on("connect", () => onReconnect());
		mgr.on("reconnect", onReconnect);

		return () => {
			// teardown socket listeners
			socket.off("disconnect", onDisconnect);
			socket.off("connect", () => onReconnect());
			socket.off("reconnect", onReconnect);

			// teardown manager listeners
			mgr.off("connect", () => onReconnect());
			mgr.off("reconnect", onReconnect);
		};
	}, [socket]);

	if (!state.room) return <p>Loading lobby…</p>;

	const startGame = () => {
		socket.emit("startGame", { code: state.room!.code }, (ok: boolean) => {
			if (!ok) {
				return alert("Could not start game");
			}
			router.push(`/host/${state.room!.code}/game`);
			dispatch({ type: "START_GAME" });
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
				backgroundImage: `url(${state.room.backgroundUrl})`,
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
						<p className="text-4xl font-mono font-bold text-secondary">{state.room.code}</p>
					</div>
					<p className="text-text-muted mb-4">Waiting for players…</p>
					<ul className="space-y-2 w-full">
						{state.room.players.map((p) => (
							<li key={p.id} className="flex items-center space-x-2 text-text">
								<span className="w-3 h-3 rounded-full bg-primary" />
								<span>{p.name}</span>
							</li>
						))}
					</ul>
				</aside>

				{/* Center panel */}
				<main className="flex-2 p-8 flex flex-col justify-between h-full">
					<div>
						<h2 className="text-3xl font-semibold text-text mb-6">Song Setup</h2>
						{/* pass our setter down so the form can tell us current URL */}
						<SongSubmitForm code={state.room.code} onUrlChange={setPreviewUrl} />

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
						{state.room.songs.map((s, i) => {
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
													{ code: state.room!.code, songId: s.id },
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
