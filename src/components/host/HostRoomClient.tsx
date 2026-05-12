"use client";

import { useEffect, useMemo, useState } from "react";
import HostGameView from "@/components/host/game/HostGameView";
import HostLobbyView from "@/components/host/lobby/HostLobbyView";
import { useRoomState } from "@/contexts/gameContext";
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
	const initialRoom = useMemo<Room>(
		() => ({
			id: 0,
			code: code.toUpperCase(),
			theme: "",
			backgroundUrl: null,
			hardcoreRequired: false,
			scoring: {
				guessPoints: 1,
				detailGuessPoints: 1,
				themeGuessPoints: 1,
				hardcoreMultiplier: 1.5,
			},
			players: [],
			songs: [],
		}),
		[code]
	);

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
			try {
				const raw = localStorage.getItem("gts-join-denied");
				if (!raw) return;
				const parsed = JSON.parse(raw) as { reason?: string };
				if (parsed.reason === "unauthorized") {
					setUnauthorized(true);
					try {
						sessionStorage.removeItem(sessionKey);
					} catch {}
					setResolvedHostToken(null);
				}
			} catch {}
		};
		readDenied();
		window.addEventListener("gts-join-denied", readDenied);
		return () => window.removeEventListener("gts-join-denied", readDenied);
	}, [sessionKey]);

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

	if (resolvedHostToken === undefined) {
		return <div className="p-6 text-center text-text">Validating host access...</div>;
	}

	if (unauthorized) {
		return <div className="p-6 text-center text-text">Host access denied for this browser session.</div>;
	}

	if (activeRoom.phase && activeRoom.phase !== "LOBBY") {
		if (!resolvedHostToken) {
			return <div className="p-6 text-center text-text">Unauthorized host link.</div>;
		}
		return (
			<HostGameView
				code={initialRoom.code}
				initialRoom={activeRoom}
				hostToken={resolvedHostToken}
				onJoinSuccess={handleHostJoinSuccess}
			/>
		);
	}

	if (!resolvedHostToken) {
		return <div className="p-6 text-center text-text">Unauthorized host link.</div>;
	}
	return (
		<HostLobbyView
			initialRoom={initialRoom}
			hostToken={resolvedHostToken}
			onJoinSuccess={handleHostJoinSuccess}
		/>
	);
}
