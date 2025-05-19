//src/component/HostDashboard/HostDashboard.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSocketContext } from "@/context/SocketContext";
import { useGameContext } from "@/context/GameContext";
import { v4 as uuidv4 } from "uuid";

type HostStatus = "connected" | "disconnected" | "reconnected" | null;

export default function HostDashboard() {
	const router = useRouter();
	const { socket, connected, reconnecting } = useSocketContext();
	const { setPlayer, setRoomId } = useGameContext();

	const [hostStatus, setHostStatus] = useState<HostStatus>(null);

	const [songs, setSongs] = useState([{ url: "", submitter: "" }]);

	const handleChange = (index: number, field: "url" | "submitter", value: string) => {
		const updatedSongs = [...songs];
		updatedSongs[index][field] = value;
		setSongs(updatedSongs);
	};

	const addSong = () => setSongs([...songs, { url: "", submitter: "" }]);
	const removeSong = (index: number) => setSongs(songs.filter((_, i) => i !== index));

	useEffect(() => {
		if (!socket) return;

		const storedRoomId = localStorage.getItem("roomId");
		if (storedRoomId) {
			socket.emit("host:rejoinRoom", { roomId: storedRoomId });
		}

		socket.on("host:rejoinSuccess", ({ room }) => {
			console.log("Rejoined room:", room.roomId);
			setRoomId(room.roomId);
			setPlayer({ id: socket.id!, name: "Host", isHost: true });
			setHostStatus("connected");
			// Optionally restore other game state from `room`
		});

		socket.on("error", (message) => {
			console.error("Socket error:", message);
			// Optionally clear localStorage if room doesn't exist
			if (message === "Room not found") {
				localStorage.removeItem("roomId");
				setRoomId(null);
			}
		});

		socket.on("host:disconnected", () => {
			setHostStatus("disconnected");
			// Or set a state to show a message/UI for this status
		});

		socket.on("host:reconnected", () => {
			setHostStatus("reconnected");
			// Optionally reset to connected after a short delay
			setTimeout(() => setHostStatus("connected"), 3000);
			// Or clear your waiting message/state here
		});

		socket.on("room:closed", () => {
			setHostStatus(null);
			setRoomId(null);
			setPlayer(null);
			localStorage.removeItem("roomId");
			router.push("/"); // or wherever the lobby/home is
		});

		return () => {
			socket.off("host:rejoinSuccess");
			socket.off("error");
			socket.off("host:disconnected");
			socket.off("host:reconnected");
			socket.off("room:closed");
		};
	}, [socket]);

	const startGame = () => {
		if (!socket || !connected) return;

		const roomId = uuidv4().slice(0, 6);
		setRoomId(roomId);
		localStorage.setItem("roomId", roomId);

		const hostId = socket.id!;
		setPlayer({ id: hostId, name: "Host", isHost: true });

		socket.emit("host:createRoom", { roomId, songs });

		router.push(`/room/${roomId}`);
	};

	return (
		<div className="p-6 max-w-xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Host Game Setup</h1>

			{reconnecting && (
				<div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded">
					Attempting to reconnect...
				</div>
			)}

			{!connected && !reconnecting && (
				<div className="mb-4 p-2 bg-red-200 text-red-800 rounded">
					Disconnected from server. Please refresh to try again.
				</div>
			)}

			{hostStatus === "disconnected" && (
				<div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded">
					You have been disconnected! Waiting to reconnect...
				</div>
			)}

			{hostStatus === "reconnected" && (
				<div className="mb-4 p-2 bg-green-200 text-green-800 rounded">
					Reconnected! The game will resume shortly.
				</div>
			)}

			{songs.map((song, index) => (
				<div key={index} className="mb-4 border rounded p-4">
					<input
						className="border p-2 w-full mb-2"
						placeholder="YouTube URL"
						value={song.url}
						onChange={(e) => handleChange(index, "url", e.target.value)}
					/>
					<input
						className="border p-2 w-full mb-2"
						placeholder="Submitter name"
						value={song.submitter}
						onChange={(e) => handleChange(index, "submitter", e.target.value)}
					/>
					<button
						onClick={() => removeSong(index)}
						className="text-sm text-red-500 hover:underline"
					>
						Remove Song
					</button>
				</div>
			))}

			<button onClick={addSong} className="bg-gray-300 px-4 py-2 rounded mb-4">
				+ Add Song
			</button>

			<button
				onClick={startGame}
				className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-50"
				disabled={!connected || songs.length === 0 || songs.some((s) => !s.url || !s.submitter)}
			>
				Start Game
			</button>
		</div>
	);
}
