"use client";

import { useEffect, useMemo } from "react";
import HostGameView from "@/components/host/HostGameView";
import HostLobbyView from "@/components/host/HostLobbyView";
import { useRoomState } from "@/contexts/gameContext";
import type { Room } from "@/types/room";

type Props = {
	code: string;
};

export default function HostRoomClient({ code }: Props) {
	const { room, setRoom } = useRoomState();
	const initialRoom = useMemo<Room>(
		() => ({
			id: 0,
			code: code.toUpperCase(),
			theme: "",
			backgroundUrl: null,
			hardcoreRequired: false,
			players: [],
			songs: [],
		}),
		[code]
	);

	const activeRoom = room?.code === initialRoom.code ? room : initialRoom;

	useEffect(() => {
		if (!room || room.code !== initialRoom.code) {
			setRoom(initialRoom);
		}
	}, [room, initialRoom, setRoom]);

	if (activeRoom.phase && activeRoom.phase !== "LOBBY") {
		return <HostGameView code={initialRoom.code} initialRoom={activeRoom} />;
	}

	return <HostLobbyView initialRoom={initialRoom} />;
}
