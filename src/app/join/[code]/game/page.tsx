"use client";
// src/app/join/[code]/game/page.tsx
import JoinGameClient from "@/components/JoinGameClient";
import { useParams, useSearchParams } from "next/navigation";

export default function JoinGamePage() {
	const params = useParams();
	let { code } = params;
	const name = useSearchParams().get("name");

	if (!code || !name) return <p>Invalid game link</p>;
	// Unwrap array if necessary
	if (Array.isArray(code)) {
		code = code[0];
	}

	return <JoinGameClient code={code} playerName={name} />;
}
