"use client";
// src/components/ui/HostCard.tsx
import { FC, FormEvent, useState } from "react";
import clsx from "clsx";
import AvatarPicker, { DiceIcon } from "@/components/shared/AvatarPicker";
import Button from "@/components/shared/Button";

interface HostCardProps {
	onCreate: (e: FormEvent) => void;
	className?: string;
	disabled?: boolean;
	isLoading?: boolean;
	compactAvatar?: boolean;
	showAvatar?: boolean;
}

const HostCreateCard: FC<HostCardProps> = ({
	onCreate,
	className,
	disabled,
	isLoading,
	compactAvatar = false,
	showAvatar = true,
}) => {
	const lock = disabled || isLoading;
	const [randomizeSignal, setRandomizeSignal] = useState(0);
	const contentClassName = clsx("flex w-full flex-col gap-3", className);

	return (
		<div className={contentClassName}>
			<form onSubmit={onCreate} className="flex flex-col gap-3">
				<div className="flex items-stretch gap-2">
					<div className="min-w-0 flex-1" aria-hidden="true" />
					<button
						type="button"
						onClick={() => setRandomizeSignal((current) => current + 1)}
						className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center text-[color:var(--color-text-muted)] transition-colors duration-150 hover:text-[color:var(--color-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
						title="Randomize avatar"
						aria-label="Randomize avatar"
						disabled={lock}
					>
						<DiceIcon className="h-full w-full" />
					</button>
				</div>
				{showAvatar && (
					<div>
						<AvatarPicker
							compact={compactAvatar}
							showRandomizeButton={false}
							randomizeSignal={randomizeSignal}
						/>
					</div>
				)}
				<div className="h-10 w-full" aria-hidden="true" />
				<Button
					type="submit"
					variant="primary"
					size="md"
					className="w-full"
					loading={isLoading}
					disabled={lock}
				>
					Create Lobby
				</Button>
			</form>
		</div>
	);
};

export default HostCreateCard;
