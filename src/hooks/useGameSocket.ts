//src/hooks/useGameSocket.ts
import { useEffect } from "react";
import { HostCreateRoomPayload } from "@/types/socket";
import { Player, Room } from "@/types/game";
import { useSocketContext } from "@/context/SocketContext";

type Handlers = {
	onRoomCreated?: (room: Room) => void;
	onRejoinSuccess?: (room: Room) => void;
	onError?: (message: string) => void;
	onRoomClosed?: () => void;
	onHostDisconnected?: () => void;
	onHostReconnected?: () => void;
	onPlayerJoined?: (player: Player) => void;
	onPlayerLeft?: (player: Player) => void;
};

export const useGameSocket = (handlers: Handlers = {}) => {
	const socket = useSocketContext();

	// Emit functions
	const createRoom = (payload: HostCreateRoomPayload) => {
		socket.emit("host:createRoom", payload);
	};

	const rejoinRoom = (roomId: string) => {
		socket.emit("host:rejoinRoom", { roomId });
	};

	// Optional: You could add more emits like joinRoom, submitGuess, etc.

	// Listen to server events
	useEffect(() => {
		if (!socket) return;

		if (handlers.onRoomCreated) {
			socket.on("host:roomCreated", handlers.onRoomCreated);
		}

		if (handlers.onRejoinSuccess) {
			socket.on("host:rejoinSuccess", ({ room }) => handlers.onRejoinSuccess!(room));
		}

		if (handlers.onError) {
			socket.on("error", handlers.onError);
		}

		if (handlers.onRoomClosed) {
			socket.on("room:closed", handlers.onRoomClosed);
		}

		if (handlers.onHostDisconnected) {
			socket.on("host:disconnected", handlers.onHostDisconnected);
		}

		if (handlers.onHostReconnected) {
			socket.on("host:reconnected", handlers.onHostReconnected);
		}

		if (handlers.onPlayerJoined) {
			socket.on("player:joined", handlers.onPlayerJoined);
		}

		if (handlers.onPlayerLeft) {
			socket.on("player:left", handlers.onPlayerLeft);
		}

		return () => {
			socket.off("host:roomCreated");
			socket.off("host:rejoinSuccess");
			socket.off("error");
			socket.off("room:closed");
			socket.off("host:disconnected");
			socket.off("host:reconnected");
			socket.off("player:joined");
			socket.off("player:left");
		};
	}, [socket, handlers]);

	return {
		socket,
		createRoom,
		rejoinRoom,
	};
};
