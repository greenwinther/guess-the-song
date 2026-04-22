"use client";

import HostRoomClient from "@/components/host/HostRoomClient";
import Loading from "@/components/shared/Loading";
import { useParams } from "next/navigation";

export default function HostRoomPage() {
	const params = useParams<{ code: string | string[] }>();
	const codeParam = params?.code;
	const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

	if (!code) return <Loading />;

	return <HostRoomClient code={code} />;
}
