"use client";
// src/app/host/[code]/page.tsx

import { useParams } from "next/navigation";
import { useMemo } from "react";
import HostLobbyClient from "@/components/HostLobbyClient";
import { Room } from "@/types/room";
import Loading from "@/components/ui/Loading";

export default function HostLobbyPage() {
	const { code } = useParams();
	const room = useMemo<Room | null>(() => {
		if (!code) return null;
		const codeStr = String(code).toUpperCase();
		return {
			id: 0,
			code: codeStr,
			theme: "",
			backgroundUrl: null,
			hardcoreRequired: false,
			players: [],
			songs: [],
		};
	}, [code]);

	if (!room) return <Loading />;

	return <HostLobbyClient initialRoom={room} />;
}
