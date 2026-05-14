"use client";

import { useEffect, useMemo, useState } from "react";
import HostGameView from "@/components/host/game/HostGameView";
import HostLobbyView from "@/components/host/lobby/HostLobbyView";
import StatusNotice from "@/components/shared/StatusNotice";
import { useRoomState } from "@/contexts/gameContext";
import { isJoinDeniedRecordInScope, readJoinDeniedRecord } from "@/lib/joinDeniedStorage";
import { createInitialRoom } from "@/lib/roomDefaults";
import type { Room } from "@/types/room";

type Props = {
	code: string;
	hostToken?: string | null;
};

export default function HostRoomClient({ code, hostToken }: Props) {
	const { room, setRoom } = useRoomState();
	const [unauthorized, setUnauthorized] = useState(false);
	const [resolvedHostToken, setResolvedHostToken] = useState<string | null | undefined>(undefined);
	const sessionKey = useMemo(() => `gts-host-token-${code.toUpperCase()}`, [code]);
	const initialRoom = useMemo<Room>(() => createInitialRoom(code), [code]);

	const activeRoom = room?.code === initialRoom.code ? room : initialRoom;

	useEffect(() => {
		const incoming = hostToken?.trim() || null;
		if (incoming) {
			try {
				sessionStorage.setItem(sessionKey, incoming);
			} catch {}
			setResolvedHostToken(incoming);
			return;
		}
		try {
			const stored = sessionStorage.getItem(sessionKey);
			setResolvedHostToken(stored?.trim() || null);
		} catch {
			setResolvedHostToken(null);
		}
	}, [hostToken, sessionKey]);

	useEffect(() => {
		if (!room || room.code !== initialRoom.code) {
			setRoom(initialRoom);
		}
	}, [room, initialRoom, setRoom]);

	useEffect(() => {
		const readDenied = () => {
			const parsed = readJoinDeniedRecord();
			if (parsed?.reason !== "unauthorized") return;
			if (!isJoinDeniedRecordInScope(parsed, { code, role: "host", playerName: "Host" })) return;
			setUnauthorized(true);
			try {
				sessionStorage.removeItem(sessionKey);
			} catch {}
			setResolvedHostToken(null);
		};
		readDenied();
		window.addEventListener("gts-join-denied", readDenied);
		return () => window.removeEventListener("gts-join-denied", readDenied);
	}, [code, sessionKey]);

	const hideTokenFromUrl = () => {
		if (typeof window === "undefined") return;
		const url = new URL(window.location.href);
		const hadToken = url.searchParams.has("token") || url.searchParams.has("hostToken");
		if (!hadToken) return;
		url.searchParams.delete("token");
		url.searchParams.delete("hostToken");
		const next = `${url.pathname}${url.search}${url.hash}`;
		window.history.replaceState(window.history.state, "", next);
	};

	const handleHostJoinSuccess = () => {
		setUnauthorized(false);
		hideTokenFromUrl();
	};
	const unauthorizedLinkMessage = "Unauthorized host link.";

	if (resolvedHostToken === undefined) {
		return <StatusNotice message="Validating host access..." />;
	}

	if (unauthorized) {
		return <StatusNotice message="Host access denied for this browser session." tone="error" />;
	}

	if (!resolvedHostToken) {
		return <StatusNotice message={unauthorizedLinkMessage} tone="error" />;
	}

	if (activeRoom.phase && activeRoom.phase !== "LOBBY") {
		return (
			<HostGameView
				code={initialRoom.code}
				initialRoom={activeRoom}
				hostToken={resolvedHostToken}
				onJoinSuccess={handleHostJoinSuccess}
			/>
		);
	}
	return (
		<HostLobbyView
			initialRoom={initialRoom}
			hostToken={resolvedHostToken}
			onJoinSuccess={handleHostJoinSuccess}
		/>
	);
}
