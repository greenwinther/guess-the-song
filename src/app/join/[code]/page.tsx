"use client";

import PlayerRoomClient from "@/components/player/PlayerRoomClient";
import Loading from "@/components/shared/Loading";
import { useParams, useSearchParams } from "next/navigation";

export default function JoinRoomPage() {
	const params = useParams<{ code: string | string[] }>();
	const name = useSearchParams().get("name");
	const codeParam = params?.code;
	const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

	if (!code || !name) return <Loading />;

	return <PlayerRoomClient code={code} playerName={name} />;
}
