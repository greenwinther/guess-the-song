"use client";
// src/components/ui/HostCard.tsx
import { FC, FormEvent } from "react";
import clsx from "clsx";
import Input from "./Input";
import Button from "./Button";

export interface HostCardProps {
	theme: string;
	onThemeChange: (value: string) => void;
	backgroundFile: File | null;
	onBackgroundChange: (file: File | null) => void;
	onCreate: (e: FormEvent) => void;
	className?: string;
}

export const HostCard: FC<HostCardProps> = ({
	theme,
	onThemeChange,
	backgroundFile,
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
				<label className="flex flex-col text-text-muted text-sm">
					<span>Background (optional)</span>
					<input
						type="file"
						accept="image/*"
						onChange={(e) => onBackgroundChange(e.target.files?.[0] || null)}
						className="mt-1 text-text"
					/>
				</label>
				<Button type="submit" variant="primary" size="md" className="w-full">
					Create Lobby
				</Button>
			</form>
		</div>
	);
};

export default HostCard;
