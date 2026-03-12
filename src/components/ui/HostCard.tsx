"use client";
// src/components/ui/HostCard.tsx
import { FC, FormEvent } from "react";
import clsx from "clsx";
import AvatarPicker from "./AvatarPicker";

import Button from "./Button";
import Input from "./Input";

interface HostCardProps {
	theme: string;
	onThemeChange: (val: string) => void;
	backgroundUrl: string;
	onBackgroundChange: (url: string) => void;
	onCreate: (e: FormEvent) => void;
	themeError?: string | null;
	backgroundUrlError?: string | null;
	className?: string;
	disabled?: boolean;
	isLoading?: boolean;
	compactAvatar?: boolean;
	showAvatar?: boolean;
}

const HostCard: FC<HostCardProps> = ({
	theme,
	onThemeChange,
	backgroundUrl,
	onBackgroundChange,
	onCreate,
	themeError,
	backgroundUrlError,
	className,
	disabled,
	isLoading,
	compactAvatar = false,
	showAvatar = true,
}) => {
	const lock = disabled || isLoading;
	const contentClassName = clsx(
		"flex w-full flex-col gap-3",
		className,
	);
	return (
		<div className={contentClassName}>
			{showAvatar && (
				<div>
					<AvatarPicker compact={compactAvatar} />
				</div>
			)}
			<form onSubmit={onCreate} className="flex flex-col gap-3">
				<Input
					type="text"
					variant={themeError ? "error" : "default"}
					placeholder="Theme (optional)"
					value={theme}
					onChange={(e) => onThemeChange(e.target.value)}
					className="w-full"
					disabled={lock}
				/>
				{themeError && <p className="-mt-2 text-xs text-red-400">{themeError}</p>}
				<Input
					type="text"
					variant={backgroundUrlError ? "error" : "default"}
					placeholder="Background image URL (optional)"
					value={backgroundUrl}
					onChange={(e) => onBackgroundChange(e.target.value)}
					className="w-full"
					disabled={lock}
				/>
				{backgroundUrlError && <p className="-mt-2 text-xs text-red-400">{backgroundUrlError}</p>}
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

export default HostCard;
