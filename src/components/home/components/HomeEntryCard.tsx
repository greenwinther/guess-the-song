"use client";

import clsx from "clsx";
import type { FormEvent, ReactNode, Ref } from "react";
import Button from "@/components/shared/Button";

type HomeEntryCardProps = {
	onSubmit: (e: FormEvent) => void;
	formRef?: Ref<HTMLFormElement>;
	className?: string;
	topContent?: ReactNode;
	topError?: ReactNode;
	middleContent?: ReactNode;
	bottomContent?: ReactNode;
	bottomError?: ReactNode;
	submitLabel: string;
	submitButtonClassName?: string;
	disabled?: boolean;
	isLoading?: boolean;
	canSubmit?: boolean;
};

export default function HomeEntryCard({
	onSubmit,
	formRef,
	className,
	topContent,
	topError,
	middleContent,
	bottomContent,
	bottomError,
	submitLabel,
	submitButtonClassName,
	disabled,
	isLoading,
	canSubmit = true,
}: HomeEntryCardProps) {
	const lock = disabled || isLoading;
	const contentClassName = clsx("flex w-full flex-col gap-3", className);

	return (
		<form ref={formRef} onSubmit={onSubmit} className={contentClassName}>
			{topContent}
			{topError}
			{middleContent}
			{bottomContent}
			{bottomError}
			<Button
				type="submit"
				variant="primary"
				size="md"
				className={clsx("w-full", submitButtonClassName)}
				loading={isLoading}
				disabled={lock || !canSubmit}
			>
				{submitLabel}
			</Button>
		</form>
	);
}
