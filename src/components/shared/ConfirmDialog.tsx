"use client";

import { useEffect, useId } from "react";
import Button, { type ButtonVariant } from "@/components/shared/Button";

type ConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmVariant?: ButtonVariant;
	onConfirm: () => void;
	onCancel: () => void;
};

export default function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	confirmVariant = "primary",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancel();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
			role="presentation"
			onMouseDown={onCancel}
		>
			<section
				className="w-full max-w-sm rounded-lg border border-border bg-card p-5 text-text shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				onMouseDown={(event) => event.stopPropagation()}
			>
				<h2 id={titleId} className="text-lg font-semibold">
					{title}
				</h2>
				<p id={descriptionId} className="mt-2 text-sm leading-6 text-text-muted">
					{description}
				</p>
				<div className="mt-5 flex justify-end gap-2">
					<Button type="button" variant="secondary" size="sm" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button type="button" variant={confirmVariant} size="sm" onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</div>
			</section>
		</div>
	);
}
