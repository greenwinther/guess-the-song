// src/components/ui/JoinCard.tsx
"use client";
import clsx from "clsx";
import GlassCard from "./GlassCard";
import AvatarPicker from "./AvatarPicker";
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
}: JoinCardProps) {
	const lock = disabled || isLoading;
	const nameOk = Boolean(name.trim());
	const codeOk = Boolean(code.trim());
	const canSubmit = !lock && nameOk && codeOk;

	return (
		<GlassCard className={clsx("w-80", className)}>
			<h2 className="text-2xl font-semibold mb-2 text-text">Join Lobby</h2>
			<div className="mb-4">
				<AvatarPicker />
			</div>
			<form onSubmit={onJoin} className="flex flex-col gap-4">
				<Input
					type="text"
					variant={nameError ? "error" : "default"}
					placeholder="Your Name"
					value={name}
					onChange={(e) => onNameChange(e.target.value)}
					required
					className="w-full"
					disabled={lock}
				/>
				{nameError && <p className="-mt-2 text-xs text-red-400">{nameError}</p>}
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
		</GlassCard>
	);
}
