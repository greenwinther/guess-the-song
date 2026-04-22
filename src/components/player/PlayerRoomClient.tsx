"use client";

import { useEffect, useMemo } from "react";
import PlayerGameView from "@/components/player/game/PlayerGameView";
import PlayerLobbyView from "@/components/player/lobby/PlayerLobbyView";
import { useRoomState } from "@/contexts/gameContext";
import type { Room } from "@/types/room";

type Props = {
	code: string;
	playerName: string;
};

export default function PlayerRoomClient({ code, playerName }: Props) {
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
		return <PlayerGameView code={initialRoom.code} playerName={playerName} />;
	}

	return <PlayerLobbyView initialRoom={initialRoom} currentUserName={playerName} />;
}
