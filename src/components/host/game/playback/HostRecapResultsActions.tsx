"use client";

import Button from "@/components/shared/Button";

type HostRecapResultsActionsProps = {
	recapRunning: boolean;
	recapTriggered: boolean;
	onShowResults: () => void;
	onStartRecap?: (fast: boolean) => void;
	onStopRecap?: () => void;
};

export default function HostRecapResultsActions({
	recapRunning,
	recapTriggered,
	onShowResults,
	onStartRecap,
	onStopRecap,
}: HostRecapResultsActionsProps) {
	return (
		<div className="flex w-full max-w-md flex-col gap-6 sm:mx-auto">
			<div className="flex items-center gap-3">
				<div className="h-px flex-1 bg-border/60" />
				<span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
					After playback
				</span>
				<div className="h-px flex-1 bg-border/60" />
			</div>
			<div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
				{!recapRunning && onStartRecap ? (
					<>
						<Button
							variant={recapTriggered ? "secondary" : "primary"}
							size="md"
							onClick={() => onStartRecap(false)}
							className="w-full"
						>
							Start recap
						</Button>
						<Button
							variant="secondary"
							size="md"
							onClick={() => onStartRecap(true)}
							className="w-full"
						>
							Fast recap
						</Button>
					</>
				) : (
					<Button
						variant="danger"
						size="md"
						onClick={onStopRecap}
						className="w-full sm:col-span-2"
					>
						Stop recap
					</Button>
				)}
			</div>

			<div className="flex items-center gap-3 pt-4">
				<div className="h-px flex-1 bg-border/45" />
				<span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
					Or skip ahead
				</span>
				<div className="h-px flex-1 bg-border/45" />
			</div>

			<div className="flex justify-center">
				<Button
					variant={recapTriggered ? "primary" : "secondary"}
					size="md"
					onClick={onShowResults}
					className="w-full sm:max-w-[13rem]"
				>
					Show Results
				</Button>
			</div>
		</div>
	);
}
