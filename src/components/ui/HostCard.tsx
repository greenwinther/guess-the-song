"use client";
// src/components/ui/HostCard.tsx
import { FC, FormEvent } from "react";
import clsx from "clsx";

import Button from "./Button";
import Input from "./Input";

export interface HostCardProps {
	theme: string;
	onThemeChange: (val: string) => void;
	backgroundUrl: string;
	onBackgroundChange: (url: string) => void;
	onCreate: (e: FormEvent) => void;
	className?: string;
	disabled?: boolean;
}

export const HostCard: FC<HostCardProps> = ({
	theme,
	onThemeChange,
	backgroundUrl,
	onBackgroundChange,
	onCreate,
	className,
}) => {
	return (
		<div
			className={clsx(
				"w-80 bg-card bg-opacity-20 border border-border rounded-2xl p-6 backdrop-blur-lg",
				className
			)}
		>
			<h2 className="text-2xl font-semibold mb-4 text-text">Create Lobby</h2>
			<form onSubmit={onCreate} className="flex flex-col gap-4">
				<Input
					type="text"
					variant="default"
					placeholder="Theme (optional)"
					value={theme}
					onChange={(e) => onThemeChange(e.target.value)}
					className="w-full"
				/>
				<Input
					type="text"
					variant="default"
					placeholder="Background image URL (optional)"
					value={backgroundUrl}
					onChange={(e) => onBackgroundChange(e.target.value)}
					className="w-full"
				/>
				<Button type="submit" variant="primary" size="md" className="w-full">
					Create Lobby
				</Button>
			</form>
		</div>
	);
};

export default HostCard;
