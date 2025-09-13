// src/components/join/ResultsPanel.tsx
import type { OrderItem } from "@/components/join/SubmissionOrderList";

export function ResultsPanel({ order, correctList }: { order: OrderItem[]; correctList: string[] }) {
	const totalCorrect = order.reduce((sum, item, idx) => sum + (item.name === correctList[idx] ? 1 : 0), 0);

	return (
		<main className="lg:col-span-6 p-4 sm:p-6 flex flex-col items-center">
			<h1 className="text-2xl font-semibold text-text mb-4">Results</h1>

			<div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md">
				<ul className="space-y-4 mb-6">
					{order.map((item, idx) => {
						const isCorrect = item.name === correctList[idx];
						return (
							<li
								key={item.id}
								className="flex items-center justify-between bg-card rounded-lg p-3"
							>
								<span className="text-secondary font-medium">{idx + 1}.</span>
								<span className="flex-1 mx-4">{item.name}</span>
								<span
									className={`${isCorrect ? "text-green-500" : "text-red-500"} font-bold`}
								>
									{isCorrect ? "1" : "0"}
								</span>
							</li>
						);
					})}
				</ul>
			</div>

			<div className="mt-6 text-center">
				<p className="text-lg">
					Your total correct: <strong>{totalCorrect} pts</strong>
				</p>
			</div>
		</main>
	);
}
