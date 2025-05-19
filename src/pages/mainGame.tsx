// src/pages/mainGame.tsx
import React, { useState } from "react";
import { useGame } from "../hooks/useGame";

export default function MainGame() {
	const { phase, connected } = useGame();
	const [input, setInput] = useState("");

	const handleSend = () => {
		if (input.trim()) {
			setInput("");
		}
	};

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Multiplayer Party Game</h1>
			<p>Connection status: {connected ? "Connected" : "Disconnected"}</p>
			<p>Current Phase: {phase}</p>

			<input
				type="text"
				value={input}
				onChange={(e) => setInput(e.target.value)}
				className="border p-2 mr-2"
				placeholder="Type a message"
			/>
			<button
				onClick={handleSend}
				className="bg-blue-600 text-white px-4 py-2 rounded"
				disabled={!connected}
			>
				Send
			</button>
		</div>
	);
}
