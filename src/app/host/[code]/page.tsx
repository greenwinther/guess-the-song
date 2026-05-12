"use client";

import HostRoomClient from "@/components/host/HostRoomClient";
import Loading from "@/components/shared/Loading";
import { useParams, useSearchParams } from "next/navigation";

export default function HostRoomPage() {
	const params = useParams<{ code: string | string[] }>();
	const searchParams = useSearchParams();
	const codeParam = params?.code;
	const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
	const token = searchParams.get("token") ?? searchParams.get("hostToken");

	if (!code) return <Loading />;

	return <HostRoomClient code={code} hostToken={token} />;
}
