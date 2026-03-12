"use client";

import Loading from "@/components/ui/Loading";
import HostControlShellClient from "@/components/HostControlShellClient";
import { useParams } from "next/navigation";

export default function ControlRoomPage() {
	const params = useParams<{ code: string | string[] }>();
	const codeParam = params?.code;
	const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

	if (!code) return <Loading />;

	return <HostControlShellClient code={code} />;
}
