// src/hooks/useGameSocket.ts
"use client";

import { useEffect, useCallback } from "react";
import { HostCreateRoomPayload } from "@/types/socket";
import { Player, Room } from "@/types/game";
import { useSocket } from "@/context/SocketContext";

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
	const socket = useSocket();

	// Emit functions with socket null guard and callbacks
	const createRoom = useCallback(
		(payload: HostCreateRoomPayload, cb?: (success: boolean) => void) => {
			if (!socket) {
				console.error("Socket is not connected.");
				cb?.(false);
				return;
			}
			socket.emit("host:createRoom", payload, (ack: boolean) => {
				cb?.(ack);
			});
		},
		[socket]
	);

	const rejoinRoom = useCallback(
		(roomId: string) => {
			if (!socket) return;
			socket.emit("host:rejoinRoom", { roomId });
		},
		[socket]
	);

	// Listen to server events with proper cleanup of exact handlers
	useEffect(() => {
		if (!socket) return;

		if (handlers.onRoomCreated) {
			socket.on("host:roomCreated", (room: Room) => handlers.onRoomCreated!(room));
		}

		if (handlers.onRejoinSuccess) {
			socket.on("host:rejoinSuccess", (payload: { room: Room }) =>
				handlers.onRejoinSuccess!(payload.room)
			);
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

		// Cleanup listeners (only those attached)
		return () => {
			if (handlers.onRoomCreated) {
				socket.off("host:roomCreated", handlers.onRoomCreated);
			}
			if (handlers.onRejoinSuccess) {
				socket.off("host:rejoinSuccess", handlers.onRejoinSuccess);
			}
			if (handlers.onError) {
				socket.off("error", handlers.onError);
			}
			if (handlers.onRoomClosed) {
				socket.off("room:closed", handlers.onRoomClosed);
			}
			if (handlers.onHostDisconnected) {
				socket.off("host:disconnected", handlers.onHostDisconnected);
			}
			if (handlers.onHostReconnected) {
				socket.off("host:reconnected", handlers.onHostReconnected);
			}
			if (handlers.onPlayerJoined) {
				socket.off("player:joined", handlers.onPlayerJoined);
			}
			if (handlers.onPlayerLeft) {
				socket.off("player:left", handlers.onPlayerLeft);
			}
		};
	}, [socket, handlers]);

	return {
		socket,
		createRoom,
		rejoinRoom,
	};
};
