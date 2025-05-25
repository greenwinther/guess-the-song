// src/components/ui/JoinCard.tsx
"use client";

import { FC, FormEvent } from "react";
import clsx from "clsx";
import Input from "./Input";
import Button from "./Button";

export interface JoinCardProps {
	name: string;
	onNameChange: (value: string) => void;
	code: string;
	onRoomCodeChange: (value: string) => void;
	onJoin: (e: FormEvent) => void;
	className?: string;
}

export const JoinCard: FC<JoinCardProps> = ({
	name,
	onNameChange,
	code,
	onRoomCodeChange,
	onJoin,
	className,
}) => {
	return (
		<div className={clsx("bg-white shadow rounded-lg p-6 w-80", className)}>
			<h2 className="text-2xl font-semibold mb-4">Join Lobby</h2>
			<form onSubmit={onJoin} className="flex flex-col gap-4">
				<Input
					type="text"
					placeholder="Your Name"
					value={name}
					onChange={(e) => onNameChange(e.target.value)}
					required
					className="w-full"
				/>
				<Input
					type="text"
					placeholder="Room Code"
					value={code}
					onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
					required
					maxLength={6}
					className="w-full uppercase"
				/>
				<Button type="submit" variant="secondary" size="md" className="mt-2">
					Join Lobby
				</Button>
			</form>
		</div>
	);
};

export default JoinCard;
