// src/components/ui/JoinCard.tsx
"use client";
import clsx from "clsx";
import Input from "./Input";
import Button from "./Button";

interface JoinCardProps {
	name: string;
	onNameChange: (val: string) => void;
	code: string;
	onRoomCodeChange: (val: string) => void;
	onJoin: (e: React.FormEvent) => void;
	hardcore: boolean;
	onHardcoreChange: (val: boolean) => void;
	className?: string;
	disabled?: boolean;
	isLoading?: boolean;
}

export default function JoinCard({
	name,
	onNameChange,
	code,
	onRoomCodeChange,
	onJoin,
	hardcore,
	onHardcoreChange,
	className,
	disabled,
	isLoading,
}: JoinCardProps) {
	const lock = disabled || isLoading;

	return (
		<div
			className={clsx(
				"w-80 bg-card bg-opacity-20 border border-border rounded-2xl p-6 backdrop-blur-lg",
				className
			)}
		>
			<h2 className="text-2xl font-semibold mb-4 text-text">Join Lobby</h2>
			<form onSubmit={onJoin} className="flex flex-col gap-4">
				<Input
					type="text"
					variant="default"
					placeholder="Your Name"
					value={name}
					onChange={(e) => onNameChange(e.target.value)}
					required
					className="w-full"
					disabled={lock}
				/>
				<Input
					type="text"
					variant="default"
					placeholder="Room Code"
					value={code}
					onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
					required
					maxLength={4}
					className="w-full"
					disabled={lock}
				/>

				{/* Hardcore toggle */}
				<label className="flex items-center gap-2 text-sm text-text/90">
					<input
						type="checkbox"
						className="h-4 w-4 accent-pink-500"
						checked={hardcore}
						onChange={(e) => onHardcoreChange(e.target.checked)}
						disabled={lock}
					/>
					<span>Play Hardcore</span>
				</label>

				<Button
					type="submit"
					variant="primary"
					size="md"
					className="w-full"
					loading={isLoading}
					disabled={lock}
				>
					Join Lobby
				</Button>
			</form>
		</div>
	);
}
