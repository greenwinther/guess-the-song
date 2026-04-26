"use client";

import { useEffect, useState } from "react";
import Input from "@/components/shared/Input";
import { useSocket } from "@/contexts/SocketContext";
import type { RoomScoring } from "@/types/room";

type AdminScoringEditorProps = {
	code: string;
	scoring: RoomScoring;
	disabled?: boolean;
};

type ScoringKey = keyof RoomScoring;

const FIELD_META: Array<{
	key: ScoringKey;
	label: string;
	type: "number";
	step?: string;
	min: string;
	max: string;
}> = [
	{ key: "guessPoints", label: "Song points", type: "number", min: "0", max: "100", step: "1" },
	{ key: "detailGuessPoints", label: "Bonus points", type: "number", min: "0", max: "100", step: "1" },
	{ key: "themeGuessPoints", label: "Theme points", type: "number", min: "0", max: "100", step: "1" },
	{ key: "hardcoreMultiplier", label: "Hardcore multiplier", type: "number", min: "1", max: "10", step: "0.1" },
];

const formatValue = (key: ScoringKey, value: number) =>
	key === "hardcoreMultiplier" ? String(value) : String(Math.round(value));

export default function AdminScoringEditor({
	code,
	scoring,
	disabled = false,
}: AdminScoringEditorProps) {
	const socket = useSocket();
	const [values, setValues] = useState<Record<ScoringKey, string>>({
		guessPoints: formatValue("guessPoints", scoring.guessPoints),
		detailGuessPoints: formatValue("detailGuessPoints", scoring.detailGuessPoints),
		themeGuessPoints: formatValue("themeGuessPoints", scoring.themeGuessPoints),
		hardcoreMultiplier: formatValue("hardcoreMultiplier", scoring.hardcoreMultiplier),
	});

	useEffect(() => {
		setValues({
			guessPoints: formatValue("guessPoints", scoring.guessPoints),
			detailGuessPoints: formatValue("detailGuessPoints", scoring.detailGuessPoints),
			themeGuessPoints: formatValue("themeGuessPoints", scoring.themeGuessPoints),
			hardcoreMultiplier: formatValue("hardcoreMultiplier", scoring.hardcoreMultiplier),
		});
	}, [scoring]);

	const commit = () => {
		if (disabled) return;

		const next = {
			guessPoints: Number.parseInt(values.guessPoints, 10),
			detailGuessPoints: Number.parseInt(values.detailGuessPoints, 10),
			themeGuessPoints: Number.parseInt(values.themeGuessPoints, 10),
			hardcoreMultiplier: Number.parseFloat(values.hardcoreMultiplier),
		};

		if (
			!Number.isFinite(next.guessPoints) ||
			!Number.isFinite(next.detailGuessPoints) ||
			!Number.isFinite(next.themeGuessPoints) ||
			!Number.isFinite(next.hardcoreMultiplier)
		) {
			setValues({
				guessPoints: formatValue("guessPoints", scoring.guessPoints),
				detailGuessPoints: formatValue("detailGuessPoints", scoring.detailGuessPoints),
				themeGuessPoints: formatValue("themeGuessPoints", scoring.themeGuessPoints),
				hardcoreMultiplier: formatValue("hardcoreMultiplier", scoring.hardcoreMultiplier),
			});
			return;
		}

		if (
			next.guessPoints === scoring.guessPoints &&
			next.detailGuessPoints === scoring.detailGuessPoints &&
			next.themeGuessPoints === scoring.themeGuessPoints &&
			next.hardcoreMultiplier === scoring.hardcoreMultiplier
		) {
			return;
		}

		socket.emit("SCORE_RULES", { code, ...next }, (ok) => {
			if (!ok) {
				setValues({
					guessPoints: formatValue("guessPoints", scoring.guessPoints),
					detailGuessPoints: formatValue("detailGuessPoints", scoring.detailGuessPoints),
					themeGuessPoints: formatValue("themeGuessPoints", scoring.themeGuessPoints),
					hardcoreMultiplier: formatValue("hardcoreMultiplier", scoring.hardcoreMultiplier),
				});
			}
		});
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<label className="text-base font-medium text-text/78">Scoring</label>
				<p className="text-xs text-text/55">Applied in final results and theme solves.</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{FIELD_META.map((field) => (
					<div key={field.key} className="flex min-w-0 items-center gap-3">
						<label className="w-32 shrink-0 text-sm text-text/72">{field.label}</label>
						<Input
							type={field.type}
							inputMode="decimal"
							min={field.min}
							max={field.max}
							step={field.step}
							value={values[field.key]}
							onChange={(event) =>
								setValues((current) => ({
									...current,
									[field.key]: event.target.value,
								}))
							}
							onBlur={commit}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									commit();
								} else if (event.key === "Escape") {
									setValues({
										guessPoints: formatValue("guessPoints", scoring.guessPoints),
										detailGuessPoints: formatValue("detailGuessPoints", scoring.detailGuessPoints),
										themeGuessPoints: formatValue("themeGuessPoints", scoring.themeGuessPoints),
										hardcoreMultiplier: formatValue("hardcoreMultiplier", scoring.hardcoreMultiplier),
									});
								}
							}}
							size="md"
							variant="default"
							className="flex-1 bg-card text-text"
							disabled={disabled}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
