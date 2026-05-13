"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/shared/Button";
import AvatarStack from "@/components/shared/AvatarStack";
import type { Member } from "@/types/member";
import { useSocket } from "@/contexts/SocketContext";

type RankedRow = {
	name: string;
	rank: number;
	score: number;
};

type ScoreGroup = {
	rank: number;
	score: number;
	names: string[];
};

type HostResultsPanelProps = {
	code: string;
	resultsFinalized: boolean;
	players: Member[];
	scores: Record<string, number>;
	theme: string;
	themeRevealed: boolean;
	onRevealTheme: () => void;
};

const placeLabel = (rank: number) => {
	if (rank === 1) return "1st place";
	if (rank === 2) return "2nd place";
	if (rank === 3) return "3rd place";
	return `${rank}th place`;
};

const podiumTone = (rank: number) => {
	if (rank === 1) {
		return {
			base: "border-highlight/40 bg-highlight/15",
			score: "text-highlight",
		};
	}
	if (rank === 2) {
		return {
			base: "border-secondary/40 bg-secondary/12",
			score: "text-secondary",
		};
	}
	return {
		base: "border-primary/40 bg-primary/12",
		score: "text-primary",
	};
};

const podiumOrder = (groups: ScoreGroup[]) => {
	const first = groups.find((group) => group.rank === 1);
	const second = groups.find((group) => group.rank === 2);
	const third = groups.find((group) => group.rank === 3);
	return [second, first, third].filter((group): group is ScoreGroup => Boolean(group));
};

function PodiumParticipant({
	name,
	player,
	isFirst,
}: {
	name: string;
	player?: Member;
	isFirst: boolean;
}) {
	const initials = name
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	const avatarSize = isFirst ? 64 : 48;

	return (
		<div className="flex w-16 shrink-0 flex-col items-center gap-0 text-center sm:w-20">
			<p
				className={`w-full truncate font-bold text-text ${isFirst ? "text-base" : "text-sm"}`}
				title={name}
			>
				{name}
			</p>
			{player?.avatar?.base ? (
				<AvatarStack
					avatar={player.avatar}
					size={avatarSize}
					className={isFirst ? "h-16 w-16" : "h-12 w-12"}
					title={name}
				/>
			) : (
				<div
					className={`grid place-items-center rounded-full border border-border/70 bg-black/15 font-bold text-secondary ${
						isFirst ? "h-16 w-16 text-xl" : "h-12 w-12 text-base"
					}`}
					title={name}
				>
					{initials || "?"}
				</div>
			)}
		</div>
	);
}

export default function HostResultsPanel({
	code,
	resultsFinalized,
	players,
	scores,
	theme,
	themeRevealed,
	onRevealTheme,
}: HostResultsPanelProps) {
	const socket = useSocket();
	const playersByName = useMemo(() => {
		const map = new Map<string, Member>();
		for (const player of players) map.set(player.name.toLowerCase(), player);
		return map;
	}, [players]);

	const rankedRows = useMemo<RankedRow[]>(() => {
		const sortedScores = Object.entries(scores).sort(
			([nameA, scoreA], [nameB, scoreB]) => scoreB - scoreA || nameA.localeCompare(nameB),
		);
		return sortedScores.map(([name, score], index) => {
			const firstMatchingIndex = sortedScores.findIndex(([, entryScore]) => entryScore === score);
			return { name, rank: firstMatchingIndex + 1 || index + 1, score };
		});
	}, [scores]);

	const topGroups = useMemo<ScoreGroup[]>(() => {
		const groups: ScoreGroup[] = [];
		for (const row of rankedRows) {
			const group = groups.find((entry) => entry.score === row.score);
			if (group) group.names.push(row.name);
			else groups.push({ rank: row.rank, score: row.score, names: [row.name] });
		}
		return groups.slice(0, 3);
	}, [rankedRows]);

	const [revealedIndexes, setRevealedIndexes] = useState<number[]>([]);
	const finalizedSentRef = useRef(false);

	useEffect(() => {
		const target = resultsFinalized ? topGroups.map((_, index) => index) : [];
		setRevealedIndexes((prev) => {
			if (prev.length === target.length && prev.every((value, index) => value === target[index])) {
				return prev;
			}
			return target;
		});
		finalizedSentRef.current = false;
	}, [scores, resultsFinalized, topGroups]);

	const reveal = (index: number) =>
		setRevealedIndexes((prev) => (prev.includes(index) ? prev : [...prev, index]));

	const revealNextIndex = (() => {
		for (let index = topGroups.length - 1; index >= 0; index--) {
			if (!revealedIndexes.includes(index)) return index;
		}
		return null;
	})();

	const revealNext = () => {
		if (revealNextIndex !== null) reveal(revealNextIndex);
	};

	const allRevealed = topGroups.length === 0 || revealedIndexes.length >= topGroups.length;
	const hasTheme = Boolean(theme?.trim());
	const requiresThemeReveal = hasTheme && !themeRevealed;
	const revealSequenceComplete = allRevealed && !requiresThemeReveal;
	const revealLabel =
		requiresThemeReveal
			? "Reveal theme"
			: revealNextIndex === null
				? "All revealed"
				: `Reveal ${placeLabel(topGroups[revealNextIndex]?.rank ?? revealNextIndex + 1)}`;

	useEffect(() => {
		if (!revealSequenceComplete || resultsFinalized) return;
		if (finalizedSentRef.current) return;
		finalizedSentRef.current = true;
		socket.emit("finalizeResults", { code }, (ok?: boolean) => {
			if (ok === false) finalizedSentRef.current = false;
		});
	}, [revealSequenceComplete, code, socket, resultsFinalized]);

	return (
		<section className="flex min-h-0 flex-1 flex-col items-center gap-4">
			<div className="flex w-full flex-col items-center justify-start text-center">
				<h2 className="text-2xl font-semibold text-text">Final Results</h2>
				<p className="mt-1 text-sm text-text-muted">
					Reveal the final sequence, then export the full game report.
				</p>
			</div>

			{hasTheme && (
				<div className="flex w-full max-w-4xl flex-col gap-2 rounded-lg border border-border/70 bg-card/45 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Theme</p>
						<p
							className="mt-0.5 truncate text-lg font-semibold text-text"
							title={themeRevealed ? theme : "Hidden until revealed"}
						>
							{themeRevealed ? theme : "Hidden until revealed"}
						</p>
					</div>
					{themeRevealed && (
						<span className="inline-flex w-fit shrink-0 items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-200">
							Revealed
						</span>
					)}
				</div>
			)}

			<div className="w-full max-w-4xl">
				<div className="grid gap-3 sm:grid-cols-3 sm:items-end sm:gap-0">
				{podiumOrder(topGroups).map((group) => {
					const sourceIndex = topGroups.findIndex((entry) => entry.rank === group.rank);
					const isRevealed = revealedIndexes.includes(sourceIndex);
					const isNextReveal = revealNextIndex === sourceIndex;
					const tone = podiumTone(group.rank);
					const isFirst = group.rank === 1;
					const baseHeightClass =
						group.rank === 1 ? "h-28" : group.rank === 2 ? "h-20" : "h-16";
					const revealAreaClass =
						group.rank === 1 ? "min-h-24" : group.rank === 2 ? "min-h-20" : "min-h-16";
					const orderClass =
						group.rank === 1 ? "sm:order-2" : group.rank === 2 ? "sm:order-1" : "sm:order-3";
					const shouldScrollParticipants = group.names.length > 3;
					return (
						<div
							key={`${group.score}-${group.rank}`}
							className={`${orderClass} flex min-w-0 flex-col items-center justify-end`}
						>
							<div
								className={`flex min-w-0 w-full items-end justify-center px-2 pb-0 text-center ${revealAreaClass}`}
							>
								{isRevealed ? (
									<div
										className={`mx-auto min-w-0 gap-2 px-1 ${
											shouldScrollParticipants
												? "scrollbar-hidden grid max-h-28 w-full max-w-[11rem] grid-cols-3 justify-items-center overflow-y-auto overflow-x-hidden sm:max-w-[13rem] lg:max-w-[15rem]"
												: "flex w-auto max-w-full flex-nowrap justify-center overflow-visible"
										}`}
									>
										{group.names.map((name) => (
											<PodiumParticipant
												key={name}
												name={name}
												player={playersByName.get(name.toLowerCase())}
												isFirst={isFirst}
											/>
										))}
									</div>
								) : (
									<p className="text-sm font-semibold italic text-text-muted">
										{isNextReveal ? "Click reveal" : "Waiting"}
									</p>
								)}
							</div>
							<button
								type="button"
								onClick={() => {
									if (isNextReveal) reveal(sourceIndex);
								}}
								disabled={isRevealed || !isNextReveal}
								className={`flex w-full flex-col items-center justify-center border px-3 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] transition ${baseHeightClass} ${tone.base} ${
									group.rank === 2
										? "rounded-tl-lg sm:rounded-tr-none"
										: group.rank === 1
											? "rounded-t-lg"
											: "rounded-tr-lg sm:rounded-tl-none"
								} ${
									isRevealed
										? "cursor-default"
										: isNextReveal
											? "hover:brightness-110"
											: "cursor-not-allowed opacity-65"
								}`}
								aria-expanded={isRevealed}
							>
								<span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
									{placeLabel(group.rank)}
								</span>
								<span className={`mt-1 text-sm font-semibold ${tone.score}`}>
									{isRevealed ? `${group.score} pts` : "Hidden"}
								</span>
							</button>
						</div>
					);
				})}
				</div>
			</div>

			{revealSequenceComplete ? (
				<div className="scrollbar-hidden min-h-0 max-h-60 w-full max-w-4xl overflow-y-auto overflow-x-hidden rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)] sm:max-h-64 lg:max-h-72">
					<table className="w-full table-fixed text-sm">
						<colgroup>
							<col className="w-20" />
							<col />
							<col className="w-24" />
						</colgroup>
						<thead className="sticky top-0 z-10 bg-[rgb(34_21_48)] shadow-[0_1px_0_rgb(255_255_255/0.08)]">
							<tr className="text-left text-xs uppercase tracking-[0.14em] text-text-muted">
								<th className="px-3 py-2 font-semibold">Place</th>
								<th className="px-3 py-2 font-semibold">Player</th>
								<th className="px-3 py-2 text-right font-semibold">Score</th>
							</tr>
						</thead>
						<tbody>
							{rankedRows.map((row) => (
								<tr key={row.name} className="border-t border-border/60 text-text">
									<td className="px-3 py-2 font-mono text-xs text-secondary sm:text-sm">
										#{row.rank}
									</td>
									<td className="truncate px-3 py-2 font-medium" title={row.name}>
										{row.name}
									</td>
									<td className="px-3 py-2 text-right font-semibold">{row.score} pts</td>
								</tr>
							))}
							{rankedRows.length === 0 && (
								<tr className="border-t border-border/60 text-text-muted">
									<td className="px-3 py-6 text-center" colSpan={3}>
										No scores to show yet.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			) : (
				<div className="flex min-h-28 w-full max-w-4xl items-center justify-center rounded-lg border border-border/70 bg-card/30 px-4 py-6 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]">
					<p className="max-w-md text-sm text-text-muted">
						Full ranking unlocks after the podium reveal.
					</p>
				</div>
			)}

			{!revealSequenceComplete && (
				<div className="flex w-full max-w-4xl justify-center">
					<Button
						variant="secondary"
						size="md"
						onClick={() => {
							if (requiresThemeReveal) {
								onRevealTheme();
								return;
							}
							revealNext();
						}}
					>
						{revealLabel}
					</Button>
				</div>
			)}
		</section>
	);
}
