"use client";
// src/app/host/[code]/game/page.tsx

import { useMemo } from "react";
import { useParams } from "next/navigation";
import HostGameClient from "@/components/HostGameClient";
import type { Room } from "@/types/room";
import Loading from "@/components/ui/Loading";

export default function HostGamePage() {
	const { code } = useParams() as { code: string };
	const initialRoom = useMemo<Room | null>(() => {
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

	if (!initialRoom) return <Loading />;

	return <HostGameClient code={code} initialRoom={initialRoom} />;
}
