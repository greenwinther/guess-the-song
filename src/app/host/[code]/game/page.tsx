"use client";
// src/app/host/[code]/game/page.tsx

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HostGameClient from "@/components/HostGameClient";
import type { Room } from "@/types/room";
import Loading from "@/components/ui/Loading";

export default function HostGamePage() {
	const { code } = useParams() as { code: string };
	const [initialRoom, setInitialRoom] = useState<Room | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const res = await fetch(`/api/rooms/${code}`, { cache: "no-store" });
			if (!res.ok) return;
			const raw: Room = await res.json();
			const mapped: Room = {
				id: raw.id,
				code: raw.code,
				theme: raw.theme,
				backgroundUrl: raw.backgroundUrl ?? undefined,
				players: raw.players.map((p) => ({ ...p, roomId: raw.id })),
				songs: raw.songs.map((s) => ({ ...s, roomId: raw.id })),
			};
			if (!cancelled) setInitialRoom(mapped);
		})();
		return () => {
			cancelled = true;
		};
	}, [code]);

	if (!initialRoom) return <Loading />;

	return <HostGameClient code={code} initialRoom={initialRoom} />;
}
