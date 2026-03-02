"use client";
// src/components/ui/HostCard.tsx
import { FC, FormEvent } from "react";
import clsx from "clsx";
import GlassCard from "./GlassCard";
import AvatarPicker from "./AvatarPicker";

import Button from "./Button";
import Input from "./Input";

interface HostCardProps {
	theme: string;
	onThemeChange: (val: string) => void;
	backgroundUrl: string;
	onBackgroundChange: (url: string) => void;
	onCreate: (e: FormEvent) => void;
	className?: string;
	disabled?: boolean;
	isLoading?: boolean;
}

const HostCard: FC<HostCardProps> = ({
	theme,
	onThemeChange,
	backgroundUrl,
	onBackgroundChange,
	onCreate,
	className,
	disabled,
	isLoading,
}) => {
	const lock = disabled || isLoading;
	return (
		<GlassCard className={clsx("w-80", className)}>
			<h2 className="text-2xl font-semibold mb-2 text-text">Create Lobby</h2>
			<div className="mb-4">
				<AvatarPicker />
			</div>
			<form onSubmit={onCreate} className="flex flex-col gap-4">
				<Input
					type="text"
					variant="default"
					placeholder="Theme (optional)"
					value={theme}
					onChange={(e) => onThemeChange(e.target.value)}
					className="w-full"
					disabled={lock}
				/>
				<Input
					type="text"
					variant="default"
					placeholder="Background image URL (optional)"
					value={backgroundUrl}
					onChange={(e) => onBackgroundChange(e.target.value)}
					className="w-full"
					disabled={lock}
				/>
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
		</GlassCard>
	);
};

export default HostCard;
