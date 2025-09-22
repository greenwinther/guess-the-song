"use client";
import { useGame } from "@/contexts/tempContext";

export function ThemeHintBanner() {
	const { themeHint, themeRevealed } = useGame();
	if (!themeHint || themeRevealed) return null;

	return (
		<div className="mt-3 w-full rounded-xl bg-card/60 border border-border p-3 text-center">
			<div className="text-sm opacity-70 mb-1">Last-round hint</div>
			<div className="text-xl font-semibold tracking-wide">{themeHint}</div>
		</div>
	);
}
