"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/shared/Button";
import AvatarStack from "@/components/shared/AvatarStack";
import type { Member } from "@/types/member";
import { useSocket } from "@/contexts/SocketContext";
import {
	buildDenseScoreRanking,
	placeLabel,
	type ScorePodiumGroup,
} from "@/lib/resultsRanking";

type HostResultsPanelProps = {
	code: string;
	resultsFinalized: boolean;
	players: Member[];
	scores: Record<string, number>;
	theme: string;
	themeRevealed: boolean;
	onRevealTheme: () => void;
};

const podiumTone = (rank: number) => {
	if (rank === 1) {
		return {
			base: "border-highlight/55 bg-highlight/15 shadow-[0_0_38px_rgb(var(--color-highlight-rgb)/0.18),inset_0_1px_0_rgb(255_255_255/0.08)]",
			score: "text-highlight",
			label: "Champion",
		};
	}
	if (rank === 2) {
		return {
			base: "border-secondary/45 bg-secondary/12 shadow-[0_18px_36px_rgb(0_0_0/0.22),inset_0_1px_0_rgb(255_255_255/0.06)]",
			score: "text-secondary",
			label: "Runner-up",
		};
	}
	return {
		base: "border-primary/45 bg-primary/12 shadow-[0_18px_36px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.06)]",
		score: "text-primary",
		label: "Third place",
	};
};

const podiumOrder = (groups: ScorePodiumGroup[]) => {
	const first = groups.find((group) => group.rank === 1);
	const second = groups.find((group) => group.rank === 2);
	const third = groups.find((group) => group.rank === 3);
	return [second, first, third].filter((group): group is ScorePodiumGroup => Boolean(group));
};

const confettiPieces = Array.from({ length: 18 }, (_, index) => index);

type WindowWithWebkitAudio = Window & {
	webkitAudioContext?: typeof AudioContext;
};

function playNoiseHit(
	context: AudioContext,
	startAt: number,
	duration: number,
	volume: number,
	frequency: number
) {
	const sampleCount = Math.floor(context.sampleRate * duration);
	const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
	const channel = buffer.getChannelData(0);
	for (let index = 0; index < sampleCount; index++) {
		const fade = 1 - index / sampleCount;
		channel[index] = (Math.random() * 2 - 1) * fade;
	}

	const source = context.createBufferSource();
	source.buffer = buffer;

	const filter = context.createBiquadFilter();
	filter.type = "bandpass";
	filter.frequency.setValueAtTime(frequency, startAt);
	filter.Q.setValueAtTime(1.8, startAt);

	const gain = context.createGain();
	gain.gain.setValueAtTime(0.0001, startAt);
	gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

	source.connect(filter);
	filter.connect(gain);
	gain.connect(context.destination);
	source.start(startAt);
	source.stop(startAt + duration);
}

function playTone(
	context: AudioContext,
	startAt: number,
	frequency: number,
	duration: number,
	volume: number
) {
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = "triangle";
	oscillator.frequency.setValueAtTime(frequency, startAt);
	gain.gain.setValueAtTime(0.0001, startAt);
	gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.025);
	gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.start(startAt);
	oscillator.stop(startAt + duration);
}

function playRevealSound(rank: number) {
	if (typeof window === "undefined") return;
	const AudioContextCtor =
		window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
	if (!AudioContextCtor) return;

	try {
		const context = new AudioContextCtor();
		void context.resume();
		const now = context.currentTime + 0.02;
		const isFirst = rank === 1;
		const hits = isFirst ? 18 : 11;
		const interval = isFirst ? 0.055 : 0.07;
		const baseVolume = isFirst ? 0.16 : 0.11;

		for (let hit = 0; hit < hits; hit++) {
			const progress = hit / Math.max(hits - 1, 1);
			playNoiseHit(
				context,
				now + hit * interval,
				0.055,
				baseVolume + progress * 0.08,
				520 + progress * 380
			);
		}

		const finishAt = now + hits * interval + 0.05;
		playNoiseHit(context, finishAt, isFirst ? 0.28 : 0.18, isFirst ? 0.34 : 0.22, 860);
		if (isFirst) {
			playTone(context, finishAt + 0.05, 523.25, 0.24, 0.07);
			playTone(context, finishAt + 0.18, 659.25, 0.24, 0.07);
			playTone(context, finishAt + 0.31, 783.99, 0.36, 0.08);
		}

		window.setTimeout(() => void context.close(), isFirst ? 2600 : 1900);
	} catch {
		// Audio is best-effort; reveal animation should continue if the browser blocks it.
	}
}

function ConfettiBurst({ isFirst }: { isFirst: boolean }) {
	return (
		<div
			className={`result-confetti-field ${isFirst ? "result-confetti-field-first" : ""}`}
			aria-hidden="true"
		>
			{confettiPieces.map((piece) => (
				<span key={piece} className="result-confetti" />
			))}
		</div>
	);
}

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

	const ranking = useMemo(() => buildDenseScoreRanking(scores), [scores]);
	const rankedRows = ranking.rows;
	const topGroups = ranking.podiumGroups;
	const revealGroups = ranking.revealGroups;

	const [revealedRanks, setRevealedRanks] = useState<number[]>([]);
	const [pendingRevealRank, setPendingRevealRank] = useState<number | null>(null);
	const [recentlyRevealedRank, setRecentlyRevealedRank] = useState<number | null>(null);
	const finalizedSentRef = useRef(false);
	const revealTimerRef = useRef<number | null>(null);
	const celebrationTimerRef = useRef<number | null>(null);

	useEffect(() => {
		const target = resultsFinalized ? topGroups.map((group) => group.rank) : [];
		setRevealedRanks((prev) => {
			if (prev.length === target.length && prev.every((value, index) => value === target[index])) {
				return prev;
			}
			return target;
		});
		finalizedSentRef.current = false;
	}, [scores, resultsFinalized, topGroups]);

	const reveal = (rank: number) =>
		setRevealedRanks((prev) => (prev.includes(rank) ? prev : [...prev, rank]));

	const revealNextGroup =
		revealGroups.find((group) => !revealedRanks.includes(group.rank)) ?? null;
	const startReveal = (rank: number) => {
		if (pendingRevealRank !== null || revealedRanks.includes(rank)) return;
		const delay = rank === 1 ? 1300 : 900;
		playRevealSound(rank);
		setPendingRevealRank(rank);
		if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
		revealTimerRef.current = window.setTimeout(() => {
			reveal(rank);
			setPendingRevealRank(null);
			setRecentlyRevealedRank(rank);
			if (celebrationTimerRef.current !== null) window.clearTimeout(celebrationTimerRef.current);
			celebrationTimerRef.current = window.setTimeout(() => {
				setRecentlyRevealedRank((current) => (current === rank ? null : current));
			}, rank === 1 ? 2400 : 1700);
		}, delay);
	};
	const revealNext = () => {
		if (revealNextGroup) startReveal(revealNextGroup.rank);
	};

	const allRevealed =
		topGroups.length === 0 || topGroups.every((group) => revealedRanks.includes(group.rank));
	const hasTheme = Boolean(theme?.trim());
	const requiresThemeReveal = hasTheme && !themeRevealed;
	const revealSequenceComplete = allRevealed && !requiresThemeReveal;
	const revealLabel =
		requiresThemeReveal
			? "Reveal theme"
			: revealNextGroup === null
				? "All revealed"
				: `Reveal ${placeLabel(revealNextGroup.rank)}`;

	useEffect(() => {
		if (!revealSequenceComplete || resultsFinalized) return;
		if (finalizedSentRef.current) return;
		finalizedSentRef.current = true;
		socket.emit("finalizeResults", { code }, (ok?: boolean) => {
			if (ok === false) finalizedSentRef.current = false;
		});
	}, [revealSequenceComplete, code, socket, resultsFinalized]);

	useEffect(() => {
		return () => {
			if (revealTimerRef.current !== null) window.clearTimeout(revealTimerRef.current);
			if (celebrationTimerRef.current !== null) window.clearTimeout(celebrationTimerRef.current);
		};
	}, []);

	return (
		<section className="flex min-h-0 flex-1 flex-col items-center gap-4">
			<div className="flex w-full flex-col items-center justify-start text-center">
				<p className="text-xs font-semibold uppercase tracking-[0.22em] text-highlight">
					Final reveal
				</p>
				<h2 className="mt-1 font-display text-3xl font-extrabold text-text sm:text-4xl">
					Final Results
				</h2>
				<p className="mt-2 max-w-xl text-sm text-text-muted">
					Podium moment: reveal the top score groups from third to first. Tied players share the same step.
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

			<div className="w-full max-w-5xl rounded-lg border border-border/70 bg-black/20 px-3 shadow-[0_24px_70px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.04)] sm:px-6">
				<div className="grid gap-3 sm:grid-cols-3 sm:items-end sm:gap-0">
				{podiumOrder(topGroups).map((group) => {
					const isRevealed = revealedRanks.includes(group.rank);
					const isNextReveal = revealNextGroup?.rank === group.rank;
					const isPendingReveal = pendingRevealRank === group.rank;
					const isCelebrating = recentlyRevealedRank === group.rank;
					const tone = podiumTone(group.rank);
					const isFirst = group.rank === 1;
					const baseHeightClass =
						group.rank === 1 ? "h-36" : group.rank === 2 ? "h-24" : "h-20";
					const revealAreaClass =
						group.rank === 1 ? "min-h-36" : group.rank === 2 ? "min-h-28" : "min-h-24";
					const orderClass =
						group.rank === 1 ? "sm:order-2" : group.rank === 2 ? "sm:order-1" : "sm:order-3";
					const shouldScrollParticipants = group.names.length > 4;
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
										className={`relative mx-auto min-w-0 gap-2 px-1 pb-3 ${
											shouldScrollParticipants
												? "scrollbar-hidden grid max-h-32 w-full max-w-[14rem] grid-cols-2 justify-items-center overflow-y-auto overflow-x-hidden sm:max-w-[15rem] lg:max-w-[18rem]"
												: "flex w-auto max-w-full flex-wrap justify-center"
										} ${isCelebrating ? (isFirst ? "result-reveal-pop-first" : "result-reveal-pop") : ""}`}
									>
										{isCelebrating && <ConfettiBurst isFirst={isFirst} />}
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
									<div
										className={`mb-5 grid h-16 w-16 place-items-center rounded-full border border-border/70 bg-card/45 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] ${
											isPendingReveal ? "result-question-pulse" : ""
										}`}
									>
										<p className="text-2xl font-extrabold text-text-muted">
											{isPendingReveal ? "..." : "?"}
										</p>
									</div>
								)}
							</div>
							<button
								type="button"
								onClick={() => {
									if (isNextReveal) startReveal(group.rank);
								}}
								disabled={isRevealed || !isNextReveal || pendingRevealRank !== null}
								className={`relative flex w-full flex-col items-center justify-center overflow-hidden border px-3 text-center transition ${baseHeightClass} ${tone.base} ${
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
								<span className="absolute inset-x-4 top-0 h-px bg-text/20" aria-hidden="true" />
								<span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
									{tone.label}
								</span>
								<span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
									{placeLabel(group.rank)}
								</span>
								<span className={`mt-2 font-display text-2xl font-extrabold ${tone.score}`}>
									{isRevealed
										? `${group.score} pts`
										: isPendingReveal
											? "Drum roll..."
											: "Hidden"}
								</span>
							</button>
						</div>
					);
				})}
				</div>
			</div>

			{revealSequenceComplete ? (
				<div className="scrollbar-hidden min-h-0 max-h-60 w-full max-w-4xl overflow-y-auto overflow-x-hidden rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)] sm:max-h-64 lg:max-h-[22rem]">
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
						disabled={pendingRevealRank !== null}
					>
						{pendingRevealRank === null ? revealLabel : "Drum roll..."}
					</Button>
				</div>
			)}
		</section>
	);
}
