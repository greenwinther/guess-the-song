"use client";

import Button from "@/components/shared/Button";

type HostRecapResultsActionsProps = {
	fastRecap: boolean;
	recapRunning: boolean;
	recapTriggered: boolean;
	onShowResults: () => void;
	onStartRecap?: () => void;
	onStopRecap?: () => void;
	onToggleFastRecap?: (checked: boolean) => void;
};

export default function HostRecapResultsActions({
	fastRecap,
	recapRunning,
	recapTriggered,
	onShowResults,
	onStartRecap,
	onStopRecap,
	onToggleFastRecap,
}: HostRecapResultsActionsProps) {
	return (
		<div className="w-full max-w-md mx-auto mt-3 sm:mt-4">
			{!recapRunning && (
				<label
					htmlFor="fast-recap"
					className="inline-flex items-center gap-2 select-none mb-2"
				>
					<input
						id="fast-recap"
						type="checkbox"
						className="h-4 w-4 accent-primary"
						checked={!!fastRecap}
						onChange={(event) => onToggleFastRecap?.(event.target.checked)}
					/>
					<span className="text-sm text-text">Fast recap</span>
				</label>
			)}

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
				{!recapRunning && onStartRecap ? (
					<Button
						variant={recapTriggered ? "secondary" : "primary"}
						size="md"
						onClick={onStartRecap}
						className="w-full sm:flex-1"
					>
						Recap
					</Button>
				) : (
					<Button
						variant="danger"
						size="md"
						onClick={onStopRecap}
						className="w-full sm:flex-1"
					>
						Stop recap
					</Button>
				)}

				<Button
					variant={recapTriggered ? "primary" : "secondary"}
					size="md"
					onClick={onShowResults}
					className="w-full sm:flex-1"
				>
					Show Results
				</Button>
			</div>
		</div>
	);
}
