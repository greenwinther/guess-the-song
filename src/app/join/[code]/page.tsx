// src/app/join/[code]/page.tsx
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import JoinLobbyClient from "@/components/JoinLobbyClient";
import { Room } from "@/types/room";
import Loading from "@/components/ui/Loading";

export default function JoinLobbyPage() {
	const { code } = useParams();
	const searchParams = useSearchParams();
	const name = searchParams.get("name");
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

	if (!room || !name) return <Loading />;

	return <JoinLobbyClient initialRoom={room} currentUserName={name} />;
}
