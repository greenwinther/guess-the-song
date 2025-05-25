// src/app/host/[code]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import type { RoomState } from "@/contexts/GameContext";
import HostLobbyClient from "@/components/HostLobbyClient";

type RawRoom = {
	id: number;
	code: string;
	theme: string;
	backgroundUrl: string | null;
	players: { id: number; name: string }[];
	songs: { id: number; url: string; submitter: string }[];
};

export default function HostLobbyPage() {
	const { code } = useParams();
	const [room, setRoom] = useState<RoomState | null>(null);

	useEffect(() => {
		if (!code) return;
		fetch(`/api/rooms/${code}`)
			.then((res) => {
				if (!res.ok) throw new Error("Room not found");
				return res.json();
			})
			.then((raw: RawRoom) => {
				// Map players & songs to include roomId
				const mapped: RoomState = {
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

	if (!room) return <p>Loading lobby…</p>;

	return <HostLobbyClient initialRoom={room} />;
}
