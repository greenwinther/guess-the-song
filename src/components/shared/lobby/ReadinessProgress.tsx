type ReadinessProgressProps = {
	readyCount: number;
	totalCount: number;
};

export default function ReadinessProgress({ readyCount, totalCount }: ReadinessProgressProps) {
	const readyPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;
	const readyCircumference = 2 * Math.PI * 42;
	const readyStrokeOffset = readyCircumference * (1 - readyPercent / 100);

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative grid h-28 w-28 place-items-center rounded-full bg-card/25 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
				<svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
					<circle
						cx="50"
						cy="50"
						r="42"
						fill="none"
						stroke="rgb(var(--color-border-rgb) / 0.7)"
						strokeWidth="8"
					/>
					<circle
						cx="50"
						cy="50"
						r="42"
						fill="none"
						stroke="rgb(var(--color-highlight-rgb) / 0.95)"
						strokeLinecap="round"
						strokeWidth="8"
						strokeDasharray={readyCircumference}
						strokeDashoffset={readyStrokeOffset}
						className="transition-[stroke-dashoffset] duration-500 ease-out"
					/>
				</svg>
				<span className="absolute text-2xl font-extrabold text-text">{readyPercent}%</span>
			</div>
			<p className="text-lg font-medium text-text-muted sm:text-xl">
				{readyCount} / {totalCount} players ready
			</p>
		</div>
	);
}
