"use client";
// src/app/join/[code]/game/page.tsx
import PlayerGameClient from "@/components/PlayerGameClient";
import { useParams, useSearchParams } from "next/navigation";

export default function PlayerGamePage() {
	const params = useParams();
	let { code } = params;
	const name = useSearchParams().get("name");

	if (!code || !name) return <p>Invalid game link</p>;
	// Unwrap array if necessary
	if (Array.isArray(code)) {
		code = code[0];
	}

	return <PlayerGameClient code={code} playerName={name} />;
}
