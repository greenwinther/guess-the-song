// src/app/join/[code]/page.tsx
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import JoinLobbyClient from "@/components/JoinLobbyClient";
import { Room } from "@/types/room";
import Loading from "@/components/ui/Loading";

export default function JoinLobbyPage() {
	const { code } = useParams();
	const searchParams = useSearchParams();
	const name = searchParams.get("name");
	const [room, setRoom] = useState<Room | null>(null);

	useEffect(() => {
		if (!code) return;
		fetch(`/api/rooms/${code}`)
			.then((res) => {
				if (!res.ok) throw new Error("Room not found");
				return res.json();
			})
			.then((raw: Room) => {
				const mapped: Room = {
					id: raw.id,
					code: raw.code,
					theme: raw.theme,
					backgroundUrl: raw.backgroundUrl ?? undefined,
					players: raw.players.map((p) => ({ ...p, roomId: raw.id })),
					songs: raw.songs.map((s) => ({ ...s, roomId: raw.id })),
				};
				setRoom(mapped);
			})
			.catch((err) => toast.error(err.message));
	}, [code]);

	if (!room || !name) return <Loading />;

	return <JoinLobbyClient initialRoom={room} currentUserName={name} />;
}
