"use client";

// src/components/ui/JoinCard.tsx
import clsx from "clsx";
import Input from "./Input";
import Button from "./Button";

interface JoinCardProps {
	name: string;
	onNameChange: (val: string) => void;
	code: string;
	onRoomCodeChange: (val: string) => void;
	onJoin: (e: React.FormEvent) => void;
	className?: string;
	disabled?: boolean;
}

export default function JoinCard({
	name,
	onNameChange,
	code,
	onRoomCodeChange,
	onJoin,
	className,
}: JoinCardProps) {
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
				/>
				<Input
					type="text"
					variant="default"
					placeholder="Room Code"
					value={code}
					onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
					required
					maxLength={6}
					className="w-full"
				/>
				<Button type="submit" variant="primary" size="md" className="w-full">
					Join Lobby
				</Button>
			</form>
		</div>
	);
}
