"use client";

import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	TouchSensor,
	type DragEndEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useEffect, useState } from "react";

export interface OrderItem {
	id: number;
	name: string;
}

interface PlayerGuessOrderListProps {
	order: OrderItem[];
	submitted: boolean;
	onDragEnd: (newOrder: OrderItem[]) => void;

	/** NEW: index of the currently active song (0-based) */
	currentIndex: number;

	/** NEW: indices that are locked (cannot change occupant) */
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
	const lockedSet = new Set(lockedIndices);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 3 } })
	);

	useEffect(() => {
		const disableScroll = (e: TouchEvent) => e.preventDefault();
		if (activeId !== null) document.body.addEventListener("touchmove", disableScroll, { passive: false });
		return () => document.body.removeEventListener("touchmove", disableScroll);
	}, [activeId]);

	const handleDragStart = (event: DragStartEvent) => setActiveId(Number(event.active.id));

	const handleDragEnd = (event: DragEndEvent) => {
		if (submitted) return;

		const { active, over } = event;
		setActiveId(null);
		if (!over || active.id === over.id) return;

		const oldIndex = order.findIndex((it) => it.id === Number(active.id));
		const newIndex = order.findIndex((it) => it.id === Number(over.id));

		// If we somehow don't find indices, bail
		if (oldIndex === -1 || newIndex === -1) return;

		// Don't allow grabbing from a locked slot
		if (lockedSet.has(oldIndex)) return;

		// If they dropped *on* a locked slot, either bail…
		if (lockedSet.has(newIndex)) return;
		// …OR (optional) snap to nearest unlocked target:
		// let target = newIndex;
		// if (lockedSet.has(target)) {
		//   const dir = newIndex > oldIndex ? 1 : -1;
		//   while (target >= 0 && target < order.length && lockedSet.has(target)) {
		//     target += dir;
		//   }
		//   if (target < 0 || target >= order.length) return;
		//   newIndex = target;
		// }

		// Build list of unlocked indices
		const unlockedIdxs = order.map((_, i) => i).filter((i) => !lockedSet.has(i));

		// Where are we inside the unlocked-only sequence?
		const posOld = unlockedIdxs.indexOf(oldIndex);
		const posNew = unlockedIdxs.indexOf(newIndex);
		if (posOld === -1 || posNew === -1) return;

		// Extract the unlocked items in order
		const unlockedItems = unlockedIdxs.map((i) => order[i]);

		// Reorder only those
		const movedUnlocked = arrayMove(unlockedItems, posOld, posNew);

		// Rebuild full candidate, keeping locked slots intact
		const candidate = order.slice();
		unlockedIdxs.forEach((i, k) => {
			candidate[i] = movedUnlocked[k];
		});

		onDragEnd(candidate);
	};

	return (
		<div className="w-full max-w-md rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)]">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToVerticalAxis]}
			>
				<SortableContext items={order.map((item) => item.id)} strategy={verticalListSortingStrategy}>
					<ul className="flex flex-col gap-2">
						{order.map((item, idx) => (
							<SortableItem
								key={item.id}
								id={item.id}
								name={item.name}
								index={idx}
								disabled={submitted || lockedSet.has(idx)}
								isCurrent={idx === currentIndex}
							/>
						))}
					</ul>
				</SortableContext>
			</DndContext>
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
			className="flex items-center gap-3 text-text"
			title={disabled ? "Locked" : isCurrent ? "Current song" : undefined}
		>
			<span
				className={`grid h-10 w-10 shrink-0 place-items-center rounded-md border font-mono text-sm ${
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
				className={`flex min-w-0 flex-1 items-center gap-3 rounded-md border px-3 py-2 text-text shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] transition-colors
        border-border/70 bg-card/45
        ${isDragging ? "scale-[1.01] opacity-90 shadow-lg" : "opacity-100"}
        ${disabled ? "cursor-not-allowed select-none opacity-60" : "cursor-grab hover:bg-card/60 active:cursor-grabbing"}`}
			>
				<span className="min-w-0 flex-1 truncate font-medium">{name}</span>
				<span className="text-xs uppercase tracking-widest text-text-muted">
					{disabled ? "Locked" : "Drag"}
				</span>
			</div>
		</li>
	);
}
