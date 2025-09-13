// src/components/join/GuessPanel.tsx
import Button from "@/components/ui/Button";
import SubmissionOrderList, { OrderItem } from "@/components/join/SubmissionOrderList";

export function GuessPanel({
	order,
	submitted,
	onReorder,
	onSubmit,
	scoreForMe,
}: {
	order: OrderItem[];
	submitted: boolean;
	onReorder: (o: OrderItem[]) => void;
	onSubmit: () => void;
	scoreForMe?: number | null;
}) {
	return (
		<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
			<h1 className="text-xl sm:text-3xl font-semibold text-text mb-4 sm:mb-6">Guess the Submitter</h1>
			<SubmissionOrderList order={order} submitted={submitted} onDragEnd={onReorder} />
			<div className="mt-6">
				<Button onClick={onSubmit} variant="primary" size="lg" disabled={submitted}>
					{submitted ? "Order Submitted" : "Submit Order"}
				</Button>
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
