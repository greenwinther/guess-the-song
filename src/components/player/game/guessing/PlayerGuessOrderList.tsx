"use client";

import {
	DndContext,
	closestCenter,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import Button from "@/components/shared/Button";

export interface OrderItem {
	id: number;
	name: string;
}

interface PlayerGuessOrderListProps {
	order: OrderItem[];
	submitted: boolean;
	onDragEnd: (newOrder: OrderItem[]) => void;
	currentIndex: number;
	lockedIndices: number[];
}

export default function PlayerGuessOrderList({
	order,
	submitted,
	onDragEnd,
	currentIndex,
	lockedIndices,
}: PlayerGuessOrderListProps) {
	const [activeId, setActiveId] = useState<number | null>(null);
	const [pickerIndex, setPickerIndex] = useState<number | null>(null);
	const lockedSet = new Set(lockedIndices);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 3 } })
	);

	useEffect(() => {
		const disableScroll = (event: TouchEvent) => event.preventDefault();
		if (activeId !== null) {
			document.body.addEventListener("touchmove", disableScroll, { passive: false });
		}
		return () => document.body.removeEventListener("touchmove", disableScroll);
	}, [activeId]);

	useEffect(() => {
		if (pickerIndex == null) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setPickerIndex(null);
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [pickerIndex]);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(Number(event.active.id));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		if (submitted) return;

		const { active, over } = event;
		setActiveId(null);
		if (!over || active.id === over.id) return;

		const oldIndex = order.findIndex((item) => item.id === Number(active.id));
		const newIndex = order.findIndex((item) => item.id === Number(over.id));

		if (oldIndex === -1 || newIndex === -1) return;
		if (lockedSet.has(oldIndex) || lockedSet.has(newIndex)) return;

		const unlockedIdxs = order.map((_, index) => index).filter((index) => !lockedSet.has(index));
		const posOld = unlockedIdxs.indexOf(oldIndex);
		const posNew = unlockedIdxs.indexOf(newIndex);
		if (posOld === -1 || posNew === -1) return;

		const unlockedItems = unlockedIdxs.map((index) => order[index]);
		const movedUnlocked = arrayMove(unlockedItems, posOld, posNew);

		const candidate = order.slice();
		unlockedIdxs.forEach((index, unlockedIndex) => {
			candidate[index] = movedUnlocked[unlockedIndex];
		});

		onDragEnd(candidate);
	};

	const handleMobileSwap = (sourceIndex: number, targetIndex: number) => {
		if (submitted) return;
		if (sourceIndex === targetIndex) {
			setPickerIndex(null);
			return;
		}
		if (lockedSet.has(sourceIndex) || lockedSet.has(targetIndex)) return;

		const candidate = order.slice();
		[candidate[targetIndex], candidate[sourceIndex]] = [candidate[sourceIndex], candidate[targetIndex]];
		onDragEnd(candidate);
		setPickerIndex(null);
	};

	const pickerOptions =
		pickerIndex == null
			? []
			: order
					.map((item, index) => ({ item, index }))
					.filter(({ index }) => index === pickerIndex || !lockedSet.has(index));

	return (
		<div className="w-full max-w-md rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)] sm:px-1.5 sm:py-1.5">
			<div className="sm:hidden">
				<div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
					Tap a slot to choose a player{order.length > 5 ? " • scroll for more" : ""}
				</div>
				<ul className="scrollbar-hidden flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
					{order.map((item, index) => {
						const disabled = submitted || lockedSet.has(index);
						const isPickerOpen = pickerIndex === index;

						return (
							<li key={item.id} className="text-text">
								<button
									type="button"
									onClick={() => {
										if (!disabled) setPickerIndex(isPickerOpen ? null : index);
									}}
									disabled={disabled}
									className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] transition-colors ${
										index === currentIndex
											? "border-primary bg-primary/15"
											: "border-border/70 bg-card/45"
									} ${
										disabled
											? "cursor-not-allowed opacity-60"
											: "hover:bg-card/60 active:bg-card/65"
									}`}
									title={disabled ? "Locked" : index === currentIndex ? "Current song" : undefined}
								>
									<span
										className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border font-mono text-sm ${
											index === currentIndex
												? "border-primary bg-primary/15 text-secondary"
												: "border-border/60 bg-black/10 text-text-muted"
										}`}
									>
										{index + 1}.
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{item.name}</p>
										<p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-text-muted">
											{disabled ? "Locked" : isPickerOpen ? "Tap a player below" : "Tap to change"}
										</p>
									</div>
								</button>

								{isPickerOpen && (
									<div className="mt-2 rounded-md border border-border/70 bg-card/45 p-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]">
										<div className="mb-2 flex items-center justify-between gap-2 px-1">
											<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
												Choose player for slot {index + 1}
											</p>
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={() => setPickerIndex(null)}
												className="px-2 py-1 text-xs"
											>
												Close
											</Button>
										</div>
										<div className="scrollbar-hidden flex max-h-48 flex-col gap-2 overflow-y-auto">
											{pickerOptions.map(({ item: option, index: optionIndex }) => (
												<button
													key={`${option.id}-${optionIndex}`}
													type="button"
													className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
														optionIndex === pickerIndex
															? "border-primary/40 bg-primary/10 text-text"
															: "border-border/70 bg-black/10 text-text hover:bg-card/60"
													}`}
													onClick={() => handleMobileSwap(optionIndex, index)}
												>
													<span className="truncate font-medium">{option.name}</span>
													<span className="ml-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
														{optionIndex === pickerIndex ? "Current" : `Slot ${optionIndex + 1}`}
													</span>
												</button>
											))}
										</div>
									</div>
								)}
							</li>
						);
					})}
				</ul>
			</div>

			<div className="hidden sm:block">
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					modifiers={[restrictToVerticalAxis]}
				>
					<SortableContext items={order.map((item) => item.id)} strategy={verticalListSortingStrategy}>
						<ul className="scrollbar-hidden flex max-h-[calc(100vh-27rem)] flex-col gap-2 overflow-y-auto pr-1">
							{order.map((item, index) => (
								<SortableItem
									key={item.id}
									id={item.id}
									name={item.name}
									index={index}
									disabled={submitted || lockedSet.has(index)}
									isCurrent={index === currentIndex}
								/>
							))}
						</ul>
					</SortableContext>
				</DndContext>
			</div>
		</div>
	);
}

function SortableItem({
	id,
	name,
	index,
	disabled,
	isCurrent,
}: {
	id: number;
	name: string;
	index: number;
	disabled: boolean;
	isCurrent: boolean;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
	const style = { transform: CSS.Transform.toString(transform), transition };

	return (
		<li
			className="flex items-center gap-2.5 text-text"
			title={disabled ? "Locked" : isCurrent ? "Current song" : undefined}
		>
			<span
				className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border font-mono text-sm ${
					isCurrent
						? "border-primary bg-primary/15 text-secondary"
						: "border-border/60 bg-black/10 text-text-muted"
				}`}
			>
				{index + 1}.
			</span>
			<div
				ref={setNodeRef}
				style={style}
				{...(!disabled ? attributes : {})}
				{...(!disabled ? listeners : {})}
				className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-border/70 bg-card/45 px-3 py-2 text-text shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] transition-colors ${
					isDragging ? "scale-[1.01] opacity-90 shadow-lg" : "opacity-100"
				} ${
					disabled
						? "cursor-not-allowed select-none opacity-60"
						: "cursor-grab hover:bg-card/60 active:cursor-grabbing"
				}`}
			>
				<span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
				<span className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
					{disabled ? "Locked" : "Drag"}
				</span>
			</div>
		</li>
	);
}
