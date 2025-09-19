// src/components/join/SubmissionOrderList.tsx
"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, TouchSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { useEffect, useState } from "react";

export interface OrderItem {
	id: number;
	name: string;
}

interface SubmissionOrderListProps {
	order: OrderItem[];
	submitted: boolean;
	onDragEnd: (newOrder: OrderItem[]) => void;

	/** NEW: index of the currently active song (0-based) */
	currentIndex: number;

	/** NEW: indices that are locked (cannot change occupant) */
	lockedIndices: number[];
}

export default function SubmissionOrderList({
	order,
	submitted,
	onDragEnd,
	currentIndex,
	lockedIndices,
}: SubmissionOrderListProps) {
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

	const handleDragStart = (event: any) => setActiveId(Number(event.active.id));

	const handleDragEnd = (event: any) => {
		if (submitted) return;

		const { active, over } = event;
		setActiveId(null);
		if (!over || active.id === over.id) return;

		const oldIndex = order.findIndex((it) => it.id === Number(active.id));
		const newIndex = order.findIndex((it) => it.id === Number(over.id));

		// Hard stops: don't allow grabbing/dropping locked positions directly
		if (lockedSet.has(oldIndex) || lockedSet.has(newIndex)) return;

		if (oldIndex !== -1 && newIndex !== -1) {
			const candidate = arrayMove(order, oldIndex, newIndex);

			// Guard: ensure **every locked index** keeps the same item as before
			for (const i of lockedSet) {
				if (candidate[i]?.id !== order[i]?.id) {
					return; // reject move that disturbs a locked slot
				}
			}

			onDragEnd(candidate);
		}
	};

	return (
		<div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToVerticalAxis, restrictToParentElement]}
			>
				<SortableContext items={order.map((item) => item.id)} strategy={verticalListSortingStrategy}>
					<ul className="space-y-4">
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
			ref={setNodeRef}
			style={style}
			{...(!disabled ? attributes : {})}
			{...(!disabled ? listeners : {})}
			className={`flex items-center justify-between rounded-lg p-3
        bg-card ${isDragging ? "opacity-80" : "opacity-100"}
        ${disabled ? "opacity-60 cursor-not-allowed select-none" : "cursor-grab"}`}
			title={disabled ? "Locked" : isCurrent ? "Current song" : undefined}
		>
			<span className="font-medium">{index + 1}.</span>
			<span className="flex-1 mx-4">{name}</span>
			{disabled && <span className="text-xs opacity-70">🔒</span>}
			{isCurrent && !disabled && <span className="text-xs opacity-70">🎯</span>}
		</li>
	);
}
