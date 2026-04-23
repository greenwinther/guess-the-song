"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Button from "@/components/shared/Button";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PlayerGuessOrderList, {
	OrderItem,
} from "@/components/player/game/guessing/PlayerGuessOrderList";

export function PlayerGuessPanel({
	order,
	detailOrder,
	detailQuestion,
	submitted,
	onReorder,
	onDetailReorder,
	onLockCurrent, // 👈 NEW
	onLockDetail,
	currentIndex, // 👈 NEW
	lockedIndices, // 👈 NEW
	detailLockedIndices,
	canLock, // 👈 NEW (e.g., there is a selection & not locked)
	canLockDetail,
	undoVisible, // 👈 optional
	onUndo, // 👈 optional
	detailUndoVisible,
	onDetailUndo,
	scoreForMe,
	themeGuessBar,
	onSubmitAll, // 👈 new (optional)
	showSubmitAll, // 👈 new (optional)
}: {
	order: OrderItem[];
	detailOrder?: OrderItem[];
	detailQuestion?: string;
	submitted: boolean;
	onReorder: (o: OrderItem[]) => void;
	onDetailReorder?: (o: OrderItem[]) => void;

	currentIndex: number;
	lockedIndices: number[];
	onLockCurrent: () => void;
	canLock: boolean;
	detailLockedIndices?: number[];
	onLockDetail?: () => void;
	canLockDetail?: boolean;

	undoVisible?: boolean;
	onUndo?: () => void;
	detailUndoVisible?: boolean;
	onDetailUndo?: () => void;

	scoreForMe?: number | null;
	themeGuessBar?: ReactNode;
	onSubmitAll?: () => void; // 👈
	showSubmitAll?: boolean; // 👈
}) {
	const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
	const isLockedCurrent = lockedIndices.includes(currentIndex);
	const isDetailLocked = detailLockedIndices?.includes(currentIndex) ?? false;
	const confirmSubmitAll = () => {
		setConfirmSubmitOpen(false);
		onSubmitAll?.();
	};

	return (
		<section className="flex flex-col items-center">
			<h1 className="text-xl sm:text-3xl font-semibold text-text mb-4 sm:mb-2">
				Make your guesses
			</h1>

			<p className="text-sm mb-4 opacity-80">
				Song {currentIndex + 1} — drag to arrange both lists, then lock each answer.
			</p>

			{themeGuessBar && <div className="mb-6 w-full max-w-3xl">{themeGuessBar}</div>}

			<div
				className={`w-full grid gap-6 ${
					detailQuestion && detailOrder && onDetailReorder ? "lg:grid-cols-2" : "grid-cols-1"
				}`}
			>
				<div className="w-full flex flex-col items-center">
					<div className="mb-3 w-full max-w-md text-left">
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
							Submitter
						</p>
						<p className="mt-1 text-sm font-medium text-text">Who submitted the song?</p>
					</div>
					<PlayerGuessOrderList
						order={order}
						submitted={submitted}
						onDragEnd={onReorder}
						currentIndex={currentIndex}
						lockedIndices={lockedIndices}
					/>

					<div className="mt-6 flex items-center gap-3 w-full max-w-md">
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
					{isLockedCurrent && (
						<div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-widest text-emerald-200">
							<span>Locked</span>
						</div>
					)}
				</div>

				{detailQuestion && detailOrder && onDetailReorder && (
					<div className="w-full flex flex-col items-center">
						<div className="mb-3 w-full max-w-md text-left">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
								Bonus question
							</p>
							<p className="mt-1 text-sm font-medium text-text">{detailQuestion}</p>
						</div>
						<PlayerGuessOrderList
							order={detailOrder}
							submitted={submitted}
							onDragEnd={onDetailReorder}
							currentIndex={currentIndex}
							lockedIndices={detailLockedIndices ?? []}
						/>
						<div className="mt-6 flex items-center gap-3 w-full max-w-md">
							<Button
								onClick={onLockDetail}
								variant="primary"
								size="lg"
								disabled={submitted || !canLockDetail}
								className="flex-1"
							>
								{submitted ? "Submitted" : "Lock in bonus"}
							</Button>
							{detailUndoVisible && onDetailUndo && (
								<Button onClick={onDetailUndo} variant="secondary" size="sm">
									Undo (2s)
								</Button>
							)}
						</div>
						{isDetailLocked && (
							<div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-widest text-emerald-200">
								<span>Locked</span>
							</div>
						)}
					</div>
				)}
			</div>
			<div className="mt-6 flex items-center gap-3">
				{showSubmitAll && onSubmitAll && (
					<Button
						onClick={() => setConfirmSubmitOpen(true)}
						variant="secondary"
						size="lg"
						disabled={submitted}
						className="flex-1"
					>
						{submitted ? "Submitted" : "Submit all guesses"}
					</Button>
				)}
			</div>
			<ConfirmDialog
				open={confirmSubmitOpen}
				title="Submit all guesses?"
				description="This will lock in your current order for every song. You can still cancel and adjust the lists first."
				confirmLabel="Submit guesses"
				onConfirm={confirmSubmitAll}
				onCancel={() => setConfirmSubmitOpen(false)}
			/>

			{scoreForMe != null && (
				<div className="mt-6 text-center">
					<p className="text-lg">
						Your final score: <strong>{scoreForMe}</strong>
					</p>
				</div>
			)}
		</section>
	);
}
