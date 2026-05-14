"use client";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useSocket } from "@/contexts/SocketContext";
import { getStoredAvatar } from "@/lib/avatarStorage";
import {
	clearJoinDeniedRecordInScope,
	type JoinDeniedReason,
	writeJoinDeniedRecord,
} from "@/lib/joinDeniedStorage";

const getClientId = () => {
	const k = "gts-client-id";
	let v = localStorage.getItem(k);
	if (!v) {
		v = crypto.randomUUID();
		localStorage.setItem(k, v);
	}
	return v;
};

export function useRoomJoinSocket(
	code: string,
	name: string,
	options?: { hostToken?: string | null; onJoinSuccess?: () => void }
) {
	const socket = useSocket();
	const joinedRef = useRef(false);
	const errorRef = useRef<string | null>(null);
	const codeRef = useRef(code);
	const nameRef = useRef(name);
	const clientIdRef = useRef<string>();
	const onJoinSuccessRef = useRef<(() => void) | undefined>(options?.onJoinSuccess);

	useEffect(() => {
		codeRef.current = code;
	}, [code]);
	useEffect(() => {
		nameRef.current = name;
	}, [name]);
	useEffect(() => {
		onJoinSuccessRef.current = options?.onJoinSuccess;
	}, [options?.onJoinSuccess]);

	useEffect(() => {
		clientIdRef.current = clientIdRef.current || getClientId();
		if (!socket) return;
		const role = options?.hostToken ? "host" : "player";
		const emitJoinDenied = (reason: JoinDeniedReason) =>
			writeJoinDeniedRecord({
				reason,
				code: codeRef.current,
				playerName: nameRef.current,
				role,
			});
		const onJoinDenied = (data: {
			reason: "kicked" | "closed" | "not_found" | "name_taken" | "unauthorized" | "error";
		}) => {
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
			if (data.reason === "name_taken") {
				toast.error("That name is already taken in this room.");
				emitJoinDenied("name_taken");
				return;
			}
			if (data.reason === "unauthorized") {
				toast.error("You are not authorized to access this room.");
				emitJoinDenied("unauthorized");
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
					hostToken: options?.hostToken ?? undefined,
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
						return;
					}
					clearJoinDeniedRecordInScope({
						code: codeRef.current,
						playerName: nameRef.current,
						role,
					});
					onJoinSuccessRef.current?.();
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
	}, [socket, options?.hostToken]);
}
