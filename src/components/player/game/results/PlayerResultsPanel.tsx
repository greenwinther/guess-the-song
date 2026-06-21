import type { OrderItem } from "@/components/player/game/guessing/PlayerGuessOrderList";

type PlayerResultsPanelProps = {
	order: OrderItem[];
	correctList: string[];
	detailOrder?: OrderItem[];
	detailCorrectList?: string[];
	detailQuestion?: string;
	rowPoints?: number[];
	theme?: string | null;
	themeRevealed?: boolean;
	themeSolved?: boolean;
	themeBonusPoints?: number;
	finalScore?: number | null;
};

function ResultBadge({ points }: { points: number }) {
	const hasPoints = points > 0;
	return (
		<span
			className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-bold ${
				hasPoints
					? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
					: "border-primary/40 bg-primary/10 text-primary"
			}`}
		>
			{points}
		</span>
	);
}

function GuessValue({ correct, value }: { correct: boolean; value: string }) {
	return (
		<span
			className={`block truncate ${correct ? "font-medium text-emerald-100" : "font-medium text-text"}`}
			title={value || "-"}
		>
			{value || "-"}
		</span>
	);
}

export function PlayerResultsPanel({
	order,
	correctList,
	detailOrder,
	detailCorrectList,
	detailQuestion,
	rowPoints,
	theme,
	themeRevealed = false,
	themeSolved = false,
	themeBonusPoints,
	finalScore,
}: PlayerResultsPanelProps) {
	const totalCorrect = order.reduce(
		(sum, item, idx) => sum + (item.name === correctList[idx] ? 1 : 0),
		0
	);
	const totalSongs = correctList.length || order.length;
	const hasDetailResults =
		Boolean(detailQuestion) &&
		Boolean(detailOrder?.length) &&
		Boolean(detailCorrectList?.some((answer) => answer.trim().length > 0));
	const totalDetailCorrect = hasDetailResults
		? (detailOrder ?? []).reduce(
				(sum, item, idx) => sum + (item.name === detailCorrectList?.[idx] ? 1 : 0),
				0
			)
		: 0;
	const rowPointsTotal = Array.isArray(rowPoints)
		? rowPoints.reduce((sum, points) => sum + (Number.isFinite(points) ? points : 0), 0)
		: null;
	const hasTheme = Boolean(theme?.trim());
	const themeText = theme?.trim() ?? "";
	const derivedThemeBonus = themeBonusPoints ?? (themeSolved ? 1 : 0);
	const localScore = (rowPointsTotal ?? (totalCorrect + totalDetailCorrect)) + derivedThemeBonus;
	const displayScore = finalScore == null ? localScore : Math.max(finalScore, localScore);
	const totalPossibleRows = totalSongs + (hasDetailResults ? totalSongs : 0);
	const earnedRows = totalCorrect + totalDetailCorrect;

	return (
		<section className="flex min-h-0 flex-1 flex-col items-center gap-5">
			<div className="w-full max-w-4xl rounded-lg border border-border/70 bg-black/20 px-4 py-5 text-center shadow-[0_24px_70px_rgb(0_0_0/0.3),inset_0_1px_0_rgb(255_255_255/0.04)]">
				<p className="text-xs font-semibold uppercase tracking-[0.22em] text-highlight">
					Final results
				</p>
				<h1 className="mt-1 font-display text-3xl font-extrabold text-text sm:text-4xl">
					{displayScore} pts
				</h1>
				<div className="mx-auto mt-4 grid max-w-2xl gap-2 sm:grid-cols-3">
					<div className="rounded-lg border border-border/60 bg-card/35 px-3 py-3">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
							Submitters
						</p>
						<p className="mt-1 text-xl font-extrabold text-text">
							{totalCorrect}/{totalSongs}
						</p>
					</div>
					<div className="rounded-lg border border-border/60 bg-card/35 px-3 py-3">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
							Bonus
						</p>
						<p className="mt-1 text-xl font-extrabold text-text">
							{hasDetailResults ? `${totalDetailCorrect}/${totalSongs}` : "-"}
						</p>
					</div>
					<div className="rounded-lg border border-border/60 bg-card/35 px-3 py-3">
						<p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
							Matched
						</p>
						<p className="mt-1 text-xl font-extrabold text-highlight">
							{earnedRows}/{totalPossibleRows || totalSongs}
						</p>
					</div>
				</div>
			</div>

			{hasTheme && (
				<div className="flex w-full max-w-4xl flex-col gap-2 rounded-lg border border-border/70 bg-card/45 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
							Theme
						</p>
						<p
							className="mt-0.5 truncate text-lg font-semibold text-text"
							title={themeRevealed ? themeText : "Hidden until the host reveals it"}
						>
							{themeRevealed ? themeText : "Hidden until revealed"}
						</p>
					</div>
					<span
						className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-sm font-semibold ${
							!themeRevealed
								? "border-border/60 bg-black/10 text-text-muted"
								: themeSolved
								? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
								: "border-primary/40 bg-primary/10 text-primary"
						}`}
					>
						{!themeRevealed
							? "Hidden"
							: themeSolved
								? `Solved +${derivedThemeBonus}`
								: "Not solved"}
					</span>
				</div>
			)}

			<div className="scrollbar-hidden w-full max-w-4xl overflow-auto rounded-lg border border-border/60 bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)] max-h-[min(36rem,calc(100vh-28rem))] min-h-0">
				<table className="w-full table-fixed text-sm">
					<colgroup>
						<col className="w-11" />
						<col className={hasDetailResults ? "w-[19%]" : "w-[38%]"} />
						<col className={hasDetailResults ? "w-[21%]" : "w-[42%]"} />
						{hasDetailResults && (
							<>
								<col className="w-[17%]" />
								<col className="w-[19%]" />
							</>
						)}
						<col className="w-16" />
					</colgroup>
					<thead className="sticky top-0 z-10 bg-[rgb(34_21_48)] shadow-[0_1px_0_rgb(255_255_255/0.08)]">
						<tr className="text-left text-xs uppercase tracking-[0.14em] text-text-muted">
							<th className="px-2 py-2 font-semibold">Song</th>
							<th className="px-2 py-2 font-semibold leading-snug">
								<span className="block">Your</span>
								<span className="block">submitter</span>
							</th>
							<th className="px-2 py-2 font-semibold leading-snug">
								<span className="block">Correct</span>
								<span className="block">submitter</span>
							</th>
							{hasDetailResults && (
								<>
									<th className="px-2 py-2 font-semibold leading-snug">
										<span className="block">Your</span>
										<span className="block">bonus</span>
									</th>
									<th className="px-2 py-2 font-semibold leading-snug">
										<span className="block">Correct</span>
										<span className="block">bonus</span>
									</th>
								</>
							)}
							<th className="px-2 py-2 text-right font-semibold">Points</th>
						</tr>
					</thead>
					<tbody className="align-middle">
					{order.map((item, idx) => {
						const isCorrect = item.name === correctList[idx];
						const detailGuess = detailOrder?.[idx]?.name ?? "";
						const detailCorrect = detailCorrectList?.[idx] ?? "";
						const detailIsCorrect = detailGuess === detailCorrect;
						const baseRowPoints = (isCorrect ? 1 : 0) + (hasDetailResults && detailIsCorrect ? 1 : 0);
						const points = rowPoints?.[idx] ?? baseRowPoints;
						return (
							<tr
								key={item.id}
								className="border-t border-border/60 text-text"
							>
								<td className="px-2 py-2 font-mono text-xs text-secondary sm:text-sm">
									{idx + 1}.
								</td>
								<td className="px-2 py-2">
									<GuessValue value={item.name} correct={isCorrect} />
								</td>
								<td className="px-2 py-2 text-text/88">
									<GuessValue value={correctList[idx] || "-"} correct={isCorrect} />
								</td>
								{hasDetailResults && (
									<>
										<td className="px-2 py-2">
											<GuessValue value={detailGuess} correct={detailIsCorrect} />
										</td>
										<td className="px-2 py-2 text-text/88">
											<GuessValue value={detailCorrect || "-"} correct={detailIsCorrect} />
										</td>
									</>
								)}
								<td className="px-2 py-2 text-right">
									<ResultBadge points={points} />
								</td>
							</tr>
						);
					})}
					</tbody>
				</table>
			</div>

		</section>
	);
}
