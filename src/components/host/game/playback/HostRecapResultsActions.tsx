"use client";

import Button from "@/components/shared/Button";

type HostRecapResultsActionsProps = {
	recapRunning: boolean;
	recapCompleted: boolean;
	revealRunning: boolean;
	onStartRecap?: () => void;
	onSkipRecap?: () => void;
	onRevealResults: () => void;
};

export default function HostRecapResultsActions({
	recapRunning,
	recapCompleted,
	revealRunning,
	onStartRecap,
	onSkipRecap,
	onRevealResults,
}: HostRecapResultsActionsProps) {
	if (revealRunning) {
		return (
			<div className="flex w-full max-w-md flex-col gap-3 sm:mx-auto">
				<p className="text-center text-sm text-text-muted">Revealing results...</p>
			</div>
		);
	}

	if (recapRunning) {
		return (
			<div className="flex w-full max-w-md flex-col gap-3 sm:mx-auto">
				<p className="text-center text-sm text-text-muted">Recap running...</p>
			</div>
		);
	}

	if (!recapCompleted) {
		return (
			<div className="flex w-full max-w-md flex-col gap-3 sm:mx-auto">
				<Button variant="primary" size="md" onClick={onStartRecap} className="w-full">
					Start recap
				</Button>
				<Button variant="secondary" size="md" onClick={onSkipRecap} className="w-full">
					Skip recap
				</Button>
			</div>
		);
	}

	return (
		<div className="flex w-full max-w-md flex-col gap-3 sm:mx-auto">
			<Button variant="primary" size="md" onClick={onRevealResults} className="w-full">
				Who submitted it?
			</Button>
		</div>
	);
}
