// src/hooks/useEnsureJoined.ts
"use client";
import { useEffect, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";

const getClientId = () => {
	const k = "gts-client-id";
	let v = localStorage.getItem(k);
	if (!v) {
		v = crypto.randomUUID();
		localStorage.setItem(k, v);
	}
	return v;
};

export function useEnsureJoined(code: string, name: string) {
	const socket = useSocket();
	const joinedRef = useRef(false);
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

		const doJoin = () => {
			if (joinedRef.current) return;
			joinedRef.current = true;
			socket.emit(
				"joinRoom",
				{ code: codeRef.current, name: nameRef.current, clientId: clientIdRef.current },
				(ok: boolean) => {
					if (!ok) {
						// allow retry if room was briefly missing or recreated
						joinedRef.current = false;
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

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			joinedRef.current = false;
		};
	}, [socket]);
}
