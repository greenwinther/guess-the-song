"use client";

import { useEffect, useState } from "react";

export type PlayerJoinDeniedReason = "kicked" | "closed" | "not_found" | "error";

export type PlayerJoinDenied = {
	reason: PlayerJoinDeniedReason;
	at: number;
};

export function usePlayerJoinDenied() {
	const [joinDenied, setJoinDenied] = useState<PlayerJoinDenied | null>(null);

	useEffect(() => {
		const readJoinDenied = () => {
			try {
				const raw = localStorage.getItem("gts-join-denied");
				if (!raw) {
					setJoinDenied(null);
					return;
				}

				const parsed = JSON.parse(raw) as PlayerJoinDenied;
				if (!parsed?.reason) {
					setJoinDenied(null);
					return;
				}

				setJoinDenied(parsed);
			} catch {
				setJoinDenied(null);
			}
		};

		readJoinDenied();
		window.addEventListener("gts-join-denied", readJoinDenied);
		window.addEventListener("storage", readJoinDenied);

		return () => {
			window.removeEventListener("gts-join-denied", readJoinDenied);
			window.removeEventListener("storage", readJoinDenied);
		};
	}, []);

	const clearJoinDenied = () => {
		localStorage.removeItem("gts-join-denied");
		setJoinDenied(null);
	};

	return {
		clearJoinDenied,
		joinDenied,
	};
}
