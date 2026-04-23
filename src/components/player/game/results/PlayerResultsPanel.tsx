import type { OrderItem } from "@/components/player/game/guessing/PlayerGuessOrderList";

type PlayerResultsPanelProps = {
	order: OrderItem[];
	correctList: string[];
	detailOrder?: OrderItem[];
	detailCorrectList?: string[];
	detailQuestion?: string;
	theme?: string | null;
	themeRevealed?: boolean;
	themeSolved?: boolean;
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
	theme,
	themeRevealed = false,
	themeSolved = false,
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
	const localScore = totalCorrect + totalDetailCorrect + (themeSolved ? 1 : 0);
	const displayScore = finalScore == null ? localScore : Math.max(finalScore, localScore);

	return (
		<section className="flex min-h-0 flex-1 flex-col items-center gap-5">
			<div className="text-center">
				<h1 className="text-2xl font-semibold text-text">Results</h1>
				<p className="mt-1 text-sm text-text-muted">
					You matched {totalCorrect} of {totalSongs} submitters
					{hasDetailResults ? ` and ${totalDetailCorrect} bonus answers` : ""}
				</p>
			</div>

			{theme && (
				<div className="flex w-full max-w-4xl flex-col gap-2 rounded-lg border border-border/70 bg-card/45 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
							Theme
						</p>
						<p
							className="mt-0.5 truncate text-lg font-semibold text-text"
							title={themeRevealed ? theme : "Hidden until the host reveals it"}
						>
							{themeRevealed ? theme : "Hidden until revealed"}
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
						{!themeRevealed ? "Hidden" : themeSolved ? "Solved +1" : "Not solved"}
					</span>
				</div>
			)}

			<div className="scrollbar-hidden w-full max-w-4xl overflow-auto rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)] max-h-[min(36rem,calc(100vh-28rem))] min-h-0">
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
						const rowPoints = (isCorrect ? 1 : 0) + (hasDetailResults && detailIsCorrect ? 1 : 0);
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
									<ResultBadge points={rowPoints} />
								</td>
							</tr>
						);
					})}
					</tbody>
				</table>
			</div>

			<div className="flex w-full max-w-4xl items-center justify-between rounded-lg border border-border/70 bg-card/45 px-4 py-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.035)]">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
					Final score
				</p>
				<p className="text-2xl font-extrabold text-text">{displayScore} pts</p>
			</div>
		</section>
	);
}
