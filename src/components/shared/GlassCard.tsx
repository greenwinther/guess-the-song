// src/components/ui/GlassCard.tsx
"use client";
import clsx from "clsx";
import type { PropsWithChildren } from "react";

export default function GlassCard({ children, className }: PropsWithChildren<{ className?: string }>) {
	return (
		<div
			className={clsx(
				"w-80 bg-card bg-opacity-20 border border-border rounded-2xl p-6 backdrop-blur-lg",
				className,
			)}
		>
			{children}
		</div>
	);
}
