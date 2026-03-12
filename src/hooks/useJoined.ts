// src/hooks/useEnsureJoined.ts
"use client";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import type { AvatarConfig } from "@/types/avatar";

const getClientId = () => {
	const k = "gts-client-id";
	let v = localStorage.getItem(k);
	if (!v) {
		v = crypto.randomUUID();
		localStorage.setItem(k, v);
	}
	return v;
};

const getStoredAvatar = (): AvatarConfig | null => {
	try {
		const raw = localStorage.getItem("gts-avatar-v2");
		if (!raw) return null;
		const parsed = JSON.parse(raw) as AvatarConfig;
		return parsed?.base ? parsed : null;
	} catch {
		return null;
	}
};

export function useJoined(code: string, name: string) {
	const socket = useSocket();
	const joinedRef = useRef(false);
	const errorRef = useRef<string | null>(null);
	const codeRef = useRef(code);
	const nameRef = useRef(name);
	const clientIdRef = useRef<string>();

	useEffect(() => {
		codeRef.current = code;
	}, [code]);
	useEffect(() => {
		nameRef.current = name;
	}, [name]);

	useEffect(() => {
		clientIdRef.current = clientIdRef.current || getClientId();
		if (!socket) return;
		const emitJoinDenied = (reason: "kicked" | "closed" | "not_found" | "error") => {
			try {
				localStorage.setItem(
					"gts-join-denied",
					JSON.stringify({ reason, at: Date.now() })
				);
				window.dispatchEvent(new Event("gts-join-denied"));
			} catch {}
		};
		const onJoinDenied = (data: { reason: "kicked" | "closed" | "not_found" | "error" }) => {
			if (data.reason === "kicked") {
				toast.error("You were kicked from this room.");
				emitJoinDenied("kicked");
				return;
			}
			if (data.reason === "closed") {
				toast.error("This room is closed.");
				emitJoinDenied("closed");
				return;
			}
			if (data.reason === "not_found") {
				toast.error("Room not found.");
				emitJoinDenied("not_found");
				return;
			}
			toast.error("Unable to join room.");
			emitJoinDenied("error");
		};

		const onSocketSynced = () => {
			toast.success("Reconnected.");
		};

		const doJoin = () => {
			if (joinedRef.current) return;
			joinedRef.current = true;
			const avatar = getStoredAvatar();
			socket.emit(
				"joinRoom",
				{
					code: codeRef.current,
					name: nameRef.current,
					clientId: clientIdRef.current,
					avatar: avatar ?? undefined,
				},
				(ok: boolean) => {
					if (!ok) {
						// allow retry if room was briefly missing or recreated
						joinedRef.current = false;
						if (errorRef.current !== codeRef.current) {
							errorRef.current = codeRef.current;
							toast.error("This room is closed or unavailable.");
						}
						// (optional) toast/console here
					}
				}
			);
		};

		const onConnect = () => {
			doJoin();
		};
		const onDisconnect = () => {
			joinedRef.current = false;
		};

		if (socket.connected) doJoin();
		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("joinDenied", onJoinDenied);
		window.addEventListener("gts-socket-synced", onSocketSynced);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("joinDenied", onJoinDenied);
			window.removeEventListener("gts-socket-synced", onSocketSynced);
			joinedRef.current = false;
		};
	}, [socket]);
}
