"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, TouchSensor } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { Menu } from "lucide-react";
import { isMobile } from "react-device-detect";

export interface OrderItem {
	id: number;
	name: string;
}

interface SubmissionOrderListProps {
	order: OrderItem[];
	submitted: boolean;
	onDragEnd: (newOrder: OrderItem[]) => void;
}

export default function SubmissionOrderList({ order, submitted, onDragEnd }: SubmissionOrderListProps) {
	const sensors = useSensors(
		isMobile
			? useSensor(TouchSensor, {
					activationConstraint: {
						delay: 100,
						tolerance: 10,
					},
			  })
			: useSensor(PointerSensor)
	);

	const handleDragEnd = (event: any) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const oldIndex = order.findIndex((item) => item.id === Number(active.id));
		const newIndex = order.findIndex((item) => item.id === Number(over.id));

		if (oldIndex !== -1 && newIndex !== -1) {
			const newOrder = arrayMove(order, oldIndex, newIndex);
			onDragEnd(newOrder);
		}
	};

	return (
		<div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xl w-full max-w-md">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToVerticalAxis, restrictToParentElement]}
			>
				<SortableContext items={order.map((item) => item.id)} strategy={verticalListSortingStrategy}>
					<ul className="space-y-4 mb-6">
						{order.map((item, idx) => (
							<SortableItem
								key={item.id}
								id={item.id}
								name={item.name}
								index={idx}
								disabled={submitted}
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
}: {
	id: number;
	name: string;
	index: number;
	disabled: boolean;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<li
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={`flex items-center justify-between bg-card rounded-lg p-4 sm:p-3 min-h-[44px] transition-transform duration-150 ${
				isDragging ? "scale-[1.02] opacity-80" : "scale-100 opacity-100"
			}`}
		>
			{/* Drag indicator */}
			<Menu className="w-5 h-5 text-muted-foreground mr-3" aria-hidden />

			{/* Index */}
			<span className="font-medium text-sm sm:text-base">{index + 1}.</span>

			{/* Name */}
			<span className="flex-1 mx-2 sm:mx-4 text-sm sm:text-base truncate">{name}</span>
		</li>
	);
}
