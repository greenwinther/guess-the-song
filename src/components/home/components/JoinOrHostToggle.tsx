// src/components/home/HomeModeToggle.tsx

import clsx from "clsx";

export default function JoinOrHostToggle({
	view,
	onViewChange,
	className,
}: {
	view: "join" | "create";
	onViewChange: (view: "join" | "create") => void;
	className?: string;
}) {
	return (
		<div
			className={clsx(
				"relative z-10 grid grid-cols-2 rounded-full border border-border/70 bg-card/12 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
				className,
			)}
		>
			<div
				className={clsx(
					"pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_8px_24px_rgba(61,174,255,0.18)] transition-transform duration-300 ease-out",
					view === "create" && "translate-x-full",
				)}
				aria-hidden="true"
			/>
			<button
				type="button"
				className={clsx(
					"relative z-10 w-full rounded-full px-6 py-2 text-base font-semibold transition-colors duration-300",
					"outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
					view === "join" ? "text-white" : "text-text/80 hover:text-text",
				)}
				onClick={() => onViewChange("join")}
				aria-pressed={view === "join"}
			>
				Join
			</button>
			<button
				type="button"
				className={clsx(
					"relative z-10 w-full rounded-full px-6 py-2 text-base font-semibold transition-colors duration-300",
					"outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
					view === "create" ? "text-white" : "text-text/80 hover:text-text",
				)}
				onClick={() => onViewChange("create")}
				aria-pressed={view === "create"}
			>
				Host
			</button>
		</div>
	);
}
