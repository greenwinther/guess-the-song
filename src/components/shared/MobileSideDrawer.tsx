import { useEffect } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";

type MobileSideDrawerProps = {
	open: boolean;
	title: string;
	side?: "left" | "right";
	onClose: () => void;
	children: ReactNode;
};

export default function MobileSideDrawer({
	open,
	title,
	side = "left",
	onClose,
	children,
}: MobileSideDrawerProps) {
	useEffect(() => {
		if (!open) return;

		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = overflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
			<button
				type="button"
				onClick={onClose}
				className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
				aria-label="Close drawer"
			/>
			<section
				className={clsx(
					"absolute top-0 h-full w-[min(23rem,86vw)] border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl",
					side === "left" ? "left-0 border-r" : "right-0 border-l"
				)}
			>
				<div className="flex h-full min-h-0 flex-col">
					<header className="flex items-center justify-between border-b border-border/70 px-4 py-3">
						<h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-text-muted">{title}</h2>
						<button
							type="button"
							onClick={onClose}
							className="rounded-md border border-border/60 bg-card/30 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-card/50"
						>
							Close
						</button>
					</header>
					<div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
				</div>
			</section>
		</div>
	);
}
