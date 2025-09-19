// src/components/join/GuessPanel.tsx
import Button from "@/components/ui/Button";
import SubmissionOrderList, { OrderItem } from "@/components/join/SubmissionOrderList";

export function GuessPanel({
	order,
	submitted,
	onReorder,
	onLockCurrent, // 👈 NEW
	currentIndex, // 👈 NEW
	lockedIndices, // 👈 NEW
	canLock, // 👈 NEW (e.g., there is a selection & not locked)
	undoVisible, // 👈 optional
	onUndo, // 👈 optional
	scoreForMe,
	onSubmitAll, // 👈 new (optional)
	showSubmitAll, // 👈 new (optional)
}: {
	order: OrderItem[];
	submitted: boolean;
	onReorder: (o: OrderItem[]) => void;

	currentIndex: number;
	lockedIndices: number[];
	onLockCurrent: () => void;
	canLock: boolean;

	undoVisible?: boolean;
	onUndo?: () => void;

	scoreForMe?: number | null;
	onSubmitAll?: () => void; // 👈
	showSubmitAll?: boolean; // 👈
}) {
	const isLockedCurrent = lockedIndices.includes(currentIndex);

	return (
		<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
			<h1 className="text-xl sm:text-3xl font-semibold text-text mb-4 sm:mb-2">Guess the Submitter</h1>

			<p className="text-sm mb-4 opacity-80">
				Song {currentIndex + 1} — Drag to choose the submitter at position {currentIndex + 1}, then
				lock.
			</p>

			<SubmissionOrderList
				order={order}
				submitted={submitted}
				onDragEnd={onReorder}
				currentIndex={currentIndex}
				lockedIndices={lockedIndices}
			/>

			<div className="mt-6 flex items-center gap-3">
				<Button
					onClick={onLockCurrent}
					variant="primary"
					size="lg"
					disabled={submitted || !canLock}
					className="flex-1"
				>
					{submitted ? "Submitted" : "Lock in answer"}
				</Button>

				{undoVisible && onUndo && (
					<Button onClick={onUndo} variant="secondary" size="sm">
						Undo (2s)
					</Button>
				)}
			</div>
			<div className="mt-6 flex items-center gap-3">
				{showSubmitAll && onSubmitAll && (
					<Button
						onClick={onSubmitAll}
						variant="secondary"
						size="lg"
						disabled={submitted}
						className="flex-1"
					>
						{submitted ? "Submitted" : "Submit all guesses"}
					</Button>
				)}
			</div>

			{scoreForMe != null && (
				<div className="mt-6 text-center">
					<p className="text-lg">
						Your final score: <strong>{scoreForMe}</strong>
					</p>
				</div>
			)}
		</main>
	);
}
