"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/shared/Button";
import ExportGameReportButton from "@/components/shared/ExportGameReportButton";

type ScoreGroup = {
	score: number;
	names: string[];
};

type HostResultsPanelProps = {
	code: string;
	roomCode: string;
	scores: Record<string, number>;
	theme: string;
	themeRevealed: boolean;
	onRevealTheme: () => void;
};

export default function HostResultsPanel({
	code,
	roomCode,
	scores,
	theme,
	themeRevealed,
	onRevealTheme,
}: HostResultsPanelProps) {
	const grouped = useMemo(() => {
		const ranking: [string, number][] = Object.entries(scores).sort(([, a], [, b]) => b - a);
		const acc: ScoreGroup[] = [];
		for (const [name, score] of ranking) {
			const group = acc.find((entry) => entry.score === score);
			if (group) group.names.push(name);
			else acc.push({ score, names: [name] });
		}
		return acc.slice(0, 3);
	}, [scores]);

	const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);

	useEffect(() => {
		setRevealedIndexes([]);
	}, [scores]);

	const reveal = (index: number) =>
		setRevealedIndexes((prev) => (prev.includes(index) ? prev : [...prev, index]));

	const revealNextIndex = (() => {
		for (let index = grouped.length - 1; index >= 0; index--) {
			if (!revealedIndexes.includes(index)) return index;
		}
		return null;
	})();

	const revealNext = () => {
		if (revealNextIndex !== null) reveal(revealNextIndex);
	};

	const allRevealed = revealedIndexes.length >= grouped.length;

	const revealLabel = () => {
		if (allRevealed) return "All revealed";
		if (revealNextIndex === 2) return "Reveal 3rd place";
		if (revealNextIndex === 1) return "Reveal 2nd place";
		if (revealNextIndex === 0) return "Reveal 1st place";
		return "Reveal next";
	};

	return (
		<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
			<div className="w-full max-w-md flex items-center justify-between mb-3 sm:mb-4">
				<h2 className="text-xl sm:text-2xl font-semibold text-text">Final Results</h2>
				{themeRevealed ? (
					<Button variant="secondary" size="sm" disabled className="whitespace-nowrap">
						{theme || "Theme"}
					</Button>
				) : (
					<Button
						variant="secondary"
						size="sm"
						onClick={onRevealTheme}
						className="whitespace-nowrap"
					>
						Reveal Theme
					</Button>
				)}
			</div>

			<div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xl w-full max-w-md">
				{grouped.map((group, index) => {
					const isRevealed = revealedIndexes.includes(index);
					return (
						<button
							key={`${group.score}-${index}`}
							onClick={() => reveal(index)}
							disabled={isRevealed}
							className={`w-full text-left flex justify-between items-center py-2 border-b border-border last:border-b-0 transition ${
								isRevealed ? "cursor-default" : "hover:bg-card/40"
							}`}
							aria-expanded={isRevealed}
						>
							{isRevealed ? (
								<>
									<span className="text-text">
										#{index + 1} {group.names.join(", ")}
									</span>
									<span className="text-text font-medium">{group.score} pts</span>
								</>
							) : (
								<span className="text-text italic">#{index + 1} Click to reveal</span>
							)}
						</button>
					);
				})}
			</div>

			<div className="flex gap-3 mt-4">
				<Button variant="secondary" size="md" onClick={revealNext} disabled={allRevealed}>
					{revealLabel()}
				</Button>
				<ExportGameReportButton code={roomCode || code} scores={scores} theme={theme} />
			</div>
		</main>
	);
}
