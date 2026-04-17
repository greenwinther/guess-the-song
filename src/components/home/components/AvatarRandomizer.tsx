"use client";
// src/components/home/AvatarActionRow.tsx

import { DiceIcon } from "@/components/shared/AvatarPicker";
import styles from "@/components/home/home.module.css";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export default function AvatarRandomizer({
	onRandomize,
	disabled,
	label = "Who are you tonight?",
}: {
	onRandomize: () => void;
	disabled?: boolean;
	label?: string;
}) {
	const [isSpinning, setIsSpinning] = useState(false);
	const randomizeTimerRef = useRef<number | null>(null);
	const spinResetTimerRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (randomizeTimerRef.current !== null) {
				window.clearTimeout(randomizeTimerRef.current);
			}
			if (spinResetTimerRef.current !== null) {
				window.clearTimeout(spinResetTimerRef.current);
			}
		};
	}, []);

	const handleRandomize = () => {
		if (disabled || isSpinning) return;

		if (randomizeTimerRef.current !== null) {
			window.clearTimeout(randomizeTimerRef.current);
		}
		if (spinResetTimerRef.current !== null) {
			window.clearTimeout(spinResetTimerRef.current);
		}

		setIsSpinning(true);
		randomizeTimerRef.current = window.setTimeout(() => {
			onRandomize();
			randomizeTimerRef.current = null;
		}, 120);
		spinResetTimerRef.current = window.setTimeout(() => {
			setIsSpinning(false);
			spinResetTimerRef.current = null;
		}, 420);
	};

	return (
		<div className="flex w-full items-center justify-between gap-3">
			<p className="px-3 text-base font-normal text-text-muted">{label}</p>
			<button
				type="button"
				onClick={handleRandomize}
				className={clsx(
					styles.avatarRandomizeButton,
					"inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center text-[color:var(--color-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 disabled:cursor-not-allowed disabled:opacity-50",
				)}
				title="Randomize avatar"
				aria-label="Randomize avatar"
				disabled={disabled}
			>
				<DiceIcon
					className={clsx(
						styles.avatarRandomizeIcon,
						"h-full w-full",
						isSpinning && styles.avatarRandomizeIconSpin,
					)}
				/>
			</button>
		</div>
	);
}
