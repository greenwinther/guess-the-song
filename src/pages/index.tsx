import { useEffect, useState } from "react";
import { useSocketContext } from "@/context/SocketContext";

export default function Home() {
	const { socket, connected } = useSocketContext();
	const [messages, setMessages] = useState<string[]>([]);
	const [input, setInput] = useState("");

	useEffect(() => {
		if (!socket) return;

		const messageHandler = (msg: string) => {
			setMessages((prev) => [...prev, msg]);
		};

		socket.on("message", messageHandler);

		// Cleanup listener on unmount or socket change
		return () => {
			socket.off("message", messageHandler);
		};
	}, [socket]);

	const sendMessage = () => {
		if (socket && input.trim()) {
			socket.emit("message", input);
			setInput("");
		}
	};

	return (
		<div className="p-4">
			<h1 className="text-xl font-bold mb-4">
				Socket.IO Chat Test {connected ? "(Connected)" : "(Disconnected)"}
			</h1>
			<div className="mb-4 border p-2 h-48 overflow-auto">
				{messages.map((msg, i) => (
					<div key={i} className="mb-1">
						{msg}
					</div>
				))}
			</div>
			<input
				value={input}
				onChange={(e) => setInput(e.target.value)}
				className="border p-2 mr-2"
				placeholder="Type a message"
			/>
			<button
				onClick={sendMessage}
				className="bg-blue-500 text-white px-4 py-2 rounded"
				disabled={!connected}
			>
				Send
			</button>
		</div>
	);
}
