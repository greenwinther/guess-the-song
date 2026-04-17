// src/components/ui/JoinCard.tsx
"use client";
import clsx from "clsx";
import { useState } from "react";
import AvatarPicker, { DiceIcon } from "./AvatarPicker";
import Input from "./Input";
import Button from "./Button";

interface JoinCardProps {
	name: string;
	onNameChange: (val: string) => void;
	code: string;
	onRoomCodeChange: (val: string) => void;
	onJoin: (e: React.FormEvent) => void;
	nameError?: string | null;
	codeError?: string | null;
	className?: string;
	disabled?: boolean;
	isLoading?: boolean;
	compactAvatar?: boolean;
	showAvatar?: boolean;
}

export default function JoinCard({
	name,
	onNameChange,
	code,
	onRoomCodeChange,
	onJoin,
	nameError,
	codeError,
	className,
	disabled,
	isLoading,
	compactAvatar = false,
	showAvatar = true,
}: JoinCardProps) {
	const lock = disabled || isLoading;
	const nameOk = Boolean(name.trim());
	const codeOk = Boolean(code.trim());
	const canSubmit = !lock && nameOk && codeOk;
	const [randomizeSignal, setRandomizeSignal] = useState(0);
	const contentClassName = clsx(
		"flex w-full flex-col gap-3",
		className,
	);

	return (
		<div className={contentClassName}>
			<form onSubmit={onJoin} className="flex flex-col gap-3">
				<div className="flex items-stretch gap-2">
					<Input
						type="text"
						variant={nameError ? "error" : "default"}
						placeholder="Your Name"
						value={name}
						onChange={(e) => onNameChange(e.target.value)}
						required
						className="min-w-0 flex-1"
						disabled={lock}
					/>
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
				{nameError && <p className="-mt-2 text-xs text-red-400">{nameError}</p>}
				{showAvatar && (
					<div>
						<AvatarPicker
							compact={compactAvatar}
							showRandomizeButton={false}
							randomizeSignal={randomizeSignal}
						/>
					</div>
				)}
				<Input
					type="text"
					variant={codeError ? "error" : "default"}
					placeholder="Room Code"
					value={code}
					onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
					required
					maxLength={4}
					className="w-full"
					disabled={lock}
				/>
				{codeError && <p className="-mt-2 text-xs text-red-400">{codeError}</p>}

				<Button
					type="submit"
					variant="primary"
					size="md"
					className="w-full"
					loading={isLoading}
					disabled={!canSubmit}
				>
					Join Lobby
				</Button>
			</form>
		</div>
	);
}
