// src/components/SocketStatusBanner.tsx
"use client";
import { useEffect, useState } from "react";
import { useSocketStatus } from "@/contexts/SocketContext";

export default function SocketStatusBanner({ delayMs = 250 }: { delayMs?: number }) {
	const { status } = useSocketStatus();
	const [show, setShow] = useState(false);

	useEffect(() => {
		let t: any;
		if (status !== "connected") {
			t = setTimeout(() => setShow(true), delayMs); // avoid flicker for very quick connects
		} else {
			setShow(false);
		}
		return () => clearTimeout(t);
	}, [status, delayMs]);

	if (!show || status === "connected") return null;

	const text =
		status === "connecting"
			? "Connecting…"
			: status === "reconnecting"
			? "Reconnecting…"
			: status === "disconnected"
			? "Disconnected — retrying…"
			: "Connection error — retrying…";

	return (
		<div className="fixed top-0 inset-x-0 z-50 bg-yellow-300 text-yellow-900 text-center text-sm py-2 shadow">
			{text}
		</div>
	);
}
