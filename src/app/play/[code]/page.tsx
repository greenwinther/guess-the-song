"use client";

import PlayerShellClient from "@/components/PlayerShellClient";
import Loading from "@/components/ui/Loading";
import { useParams, useSearchParams } from "next/navigation";

export default function PlayRoomPage() {
	const params = useParams<{ code: string | string[] }>();
	const name = useSearchParams().get("name");
	const codeParam = params?.code;
	const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

	if (!code || !name) return <Loading />;

	return <PlayerShellClient code={code} playerName={name} />;
}
