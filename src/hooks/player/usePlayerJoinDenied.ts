"use client";

import { useEffect, useState } from "react";
import {
	clearJoinDeniedRecordInScope,
	isJoinDeniedRecordInScope,
	readJoinDeniedRecord,
	type JoinDeniedReason,
	type JoinDeniedScope,
} from "@/lib/joinDeniedStorage";

export type PlayerJoinDeniedReason = JoinDeniedReason;

export type PlayerJoinDenied = {
	reason: PlayerJoinDeniedReason;
	at: number;
};

export function usePlayerJoinDenied(scope: JoinDeniedScope) {
	const [joinDenied, setJoinDenied] = useState<PlayerJoinDenied | null>(null);
	const scopedCode = scope.code;
	const scopedPlayerName = scope.playerName;
	const scopedRole = scope.role;

	useEffect(() => {
		const readJoinDenied = () => {
			const parsed = readJoinDeniedRecord();
			if (
				!isJoinDeniedRecordInScope(parsed, {
					code: scopedCode,
					playerName: scopedPlayerName,
					role: scopedRole,
				})
			) {
				setJoinDenied(null);
				return;
			}
			if (!parsed) {
				setJoinDenied(null);
				return;
			}
			setJoinDenied({ reason: parsed.reason, at: parsed.at });
		};

		readJoinDenied();
		window.addEventListener("gts-join-denied", readJoinDenied);
		window.addEventListener("storage", readJoinDenied);

		return () => {
			window.removeEventListener("gts-join-denied", readJoinDenied);
			window.removeEventListener("storage", readJoinDenied);
		};
	}, [scopedCode, scopedPlayerName, scopedRole]);

	const clearJoinDenied = () => {
		clearJoinDeniedRecordInScope({
			code: scopedCode,
			playerName: scopedPlayerName,
			role: scopedRole,
		});
		setJoinDenied(null);
	};

	return {
		clearJoinDenied,
		joinDenied,
	};
}
