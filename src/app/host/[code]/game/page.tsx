"use client";
// src/app/host/[code]/game/page.tsx

import HostGameClient from "@/components/HostGameClient";
import { useParams } from "next/navigation";

export default function HostGamePage() {
	const params = useParams();
	let { code } = params; // code: string | string[] | undefined

	if (!code) {
		return <p>Invalid room code</p>;
	}
	// If it came through as an array, pick the first entry
	if (Array.isArray(code)) {
		code = code[0];
	}

	return <HostGameClient code={code} />;
}
