// src/components/SubmissionOrderList.tsx
("use client");

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export interface OrderItem {
	id: number;
	name: string;
}

interface SubmissionOrderListProps {
	order: OrderItem[];
	submitted: boolean;
	onDragEnd: (result: DropResult) => void;
}

export default function SubmissionOrderList({ order, submitted, onDragEnd }: SubmissionOrderListProps) {
	return (
		<div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md">
			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable droppableId="guess-order-list">
					{(provided) => (
						<ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-4 mb-6">
							{order.map((item, idx) => (
								<Draggable
									key={item.id.toString()}
									draggableId={item.id.toString()}
									index={idx}
									isDragDisabled={submitted}
								>
									{(draggableProvided, snapshot) => (
										<li
											ref={draggableProvided.innerRef}
											{...draggableProvided.draggableProps}
											{...draggableProvided.dragHandleProps}
											className={`flex items-center justify-between bg-card rounded-lg p-3 ${
												snapshot.isDragging ? "opacity-80" : "opacity-100"
											}`}
										>
											<span className="font-medium">{idx + 1}.</span>
											<span className="flex-1 mx-4">{item.name}</span>
										</li>
									)}
								</Draggable>
							))}

							{provided.placeholder}
						</ul>
					)}
				</Droppable>
			</DragDropContext>
		</div>
	);
}
