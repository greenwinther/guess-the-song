"use client";

import { useEffect, useState } from "react";

type UseHostDebugVisibilityOptions = {
	enableKeyboardShortcut?: boolean;
};

export function useHostDebugVisibility({
	enableKeyboardShortcut = false,
}: UseHostDebugVisibilityOptions = {}) {
	const [showDebug, setShowDebug] = useState<boolean>(() => {
		if (typeof window === "undefined") return true;
		return localStorage.getItem("gts_debug_panel") !== "0";
	});

	useEffect(() => {
		localStorage.setItem("gts_debug_panel", showDebug ? "1" : "0");
	}, [showDebug]);

	useEffect(() => {
		if (!enableKeyboardShortcut) return;

		const onKey = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (!target) return;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
				return;
			}
			if (event.code === "KeyD") setShowDebug((prev) => !prev);
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [enableKeyboardShortcut]);

	return {
		showDebug,
		setShowDebug,
		toggleDebug: () => setShowDebug((prev) => !prev),
	};
}
