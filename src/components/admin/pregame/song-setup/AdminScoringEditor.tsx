"use client";

import { useEffect, useState } from "react";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import { useSocket } from "@/contexts/SocketContext";
import type { HardcoreRewardMode, RoomScoring, RoomTieBreaker } from "@/types/room";

type AdminScoringEditorProps = {
	code: string;
	scoring: RoomScoring;
	disabled?: boolean;
	onSaved?: () => void;
};

type ScoringFormValues = {
	guessPoints: string;
	detailGuessPoints: string;
	hardcoreRewardMode: HardcoreRewardMode;
	hardcoreStartBonusPoints: string;
	hardcoreMultiplier: string;
	themeGuessesPerSong: string;
	themeCorrectPoints: string;
	firstCorrectThemeBonusEnabled: boolean;
	firstCorrectThemePoints: string;
	tieBreaker: RoomTieBreaker;
};

const formatNumber = (value: number) => String(Number.isInteger(value) ? Math.round(value) : value);

const toValues = (scoring: RoomScoring): ScoringFormValues => ({
	guessPoints: formatNumber(scoring.guessPoints),
	detailGuessPoints: formatNumber(scoring.detailGuessPoints),
	hardcoreRewardMode: scoring.hardcoreRules.rewardMode,
	hardcoreStartBonusPoints: formatNumber(scoring.hardcoreRules.startBonusPoints),
	hardcoreMultiplier: formatNumber(scoring.hardcoreRules.multiplier),
	themeGuessesPerSong: formatNumber(scoring.themeRules.guessesPerSong),
	themeCorrectPoints: formatNumber(scoring.themeRules.correctThemePoints),
	firstCorrectThemeBonusEnabled: scoring.themeRules.firstCorrectThemeBonusEnabled,
	firstCorrectThemePoints: formatNumber(scoring.themeRules.firstCorrectThemePoints),
	tieBreaker: scoring.tieBreaker,
});

const parseInteger = (value: string) => Number.parseInt(value, 10);
const parseDecimal = (value: string) => Number.parseFloat(value);

function ChoiceButton<TValue extends string>({
	value,
	current,
	label,
	disabled,
	onChange,
}: {
	value: TValue;
	current: TValue;
	label: string;
	disabled: boolean;
	onChange: (value: TValue) => void;
}) {
	const selected = value === current;
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={() => onChange(value)}
			className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
				selected
					? "border-secondary/60 bg-secondary/15 text-secondary"
					: "border-border/60 bg-black/10 text-text/78 hover:bg-white/5"
			} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
			aria-pressed={selected}
		>
			{label}
		</button>
	);
}

function NumberField({
	label,
	value,
	min,
	max,
	step = "1",
	disabled,
	onChange,
	onCommit,
}: {
	label: string;
	value: string;
	min: string;
	max: string;
	step?: string;
	disabled: boolean;
	onChange: (value: string) => void;
	onCommit: () => void;
}) {
	return (
		<label className="flex min-w-0 items-center gap-3 text-sm text-text/72">
			<span className="w-36 shrink-0">{label}</span>
			<Input
				type="number"
				inputMode="decimal"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				onBlur={onCommit}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						onCommit();
					}
				}}
				size="md"
				variant="default"
				className="flex-1 bg-card text-text"
				disabled={disabled}
			/>
		</label>
	);
}

export default function AdminScoringEditor({
	code,
	scoring,
	disabled = false,
	onSaved,
}: AdminScoringEditorProps) {
	const socket = useSocket();
	const [values, setValues] = useState<ScoringFormValues>(() => toValues(scoring));

	useEffect(() => {
		setValues(toValues(scoring));
	}, [scoring]);

	const reset = () => setValues(toValues(scoring));

	const commit = (nextValues = values, onSuccess?: () => void) => {
		if (disabled) return;

		const guessPoints = parseInteger(nextValues.guessPoints);
		const detailGuessPoints = parseInteger(nextValues.detailGuessPoints);
		const startBonusPoints = parseDecimal(nextValues.hardcoreStartBonusPoints);
		const multiplier = parseDecimal(nextValues.hardcoreMultiplier);
		const guessesPerSong = parseInteger(nextValues.themeGuessesPerSong);
		const correctThemePoints = parseInteger(nextValues.themeCorrectPoints);
		const firstCorrectThemePoints = parseInteger(nextValues.firstCorrectThemePoints);

		if (
			!Number.isFinite(guessPoints) ||
			!Number.isFinite(detailGuessPoints) ||
			!Number.isFinite(startBonusPoints) ||
			!Number.isFinite(multiplier) ||
			!Number.isFinite(guessesPerSong) ||
			!Number.isFinite(correctThemePoints) ||
			!Number.isFinite(firstCorrectThemePoints)
		) {
			reset();
			return;
		}

		const next: RoomScoring = {
			guessPoints,
			detailGuessPoints,
			themeGuessPoints: correctThemePoints,
			hardcoreMultiplier: multiplier,
			hardcoreRules: {
				enabled: nextValues.hardcoreRewardMode !== "none",
				rewardMode: nextValues.hardcoreRewardMode,
				startBonusPoints,
				multiplier,
			},
			themeRules: {
				guessesPerSong,
				correctThemePoints,
				firstCorrectThemeBonusEnabled: nextValues.firstCorrectThemeBonusEnabled,
				firstCorrectThemePoints,
			},
			tieBreaker: nextValues.tieBreaker,
		};

		socket.emit("SCORE_RULES", { code, ...next }, (ok) => {
			if (!ok) {
				reset();
				return;
			}
			onSuccess?.();
		});
	};

	const updateAndCommit = (next: ScoringFormValues) => {
		setValues(next);
		commit(next);
	};

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-center justify-between gap-3">
				<label className="text-base font-medium text-text/78">Scoring</label>
				<p className="text-xs text-text/55">Applied in final results and theme solves.</p>
			</div>

			<section className="grid gap-3 sm:grid-cols-2">
				<NumberField
					label="Song points"
					value={values.guessPoints}
					min="0"
					max="100"
					disabled={disabled}
					onChange={(value) => setValues((current) => ({ ...current, guessPoints: value }))}
					onCommit={() => commit()}
				/>
				<NumberField
					label="Bonus points"
					value={values.detailGuessPoints}
					min="0"
					max="100"
					disabled={disabled}
					onChange={(value) => setValues((current) => ({ ...current, detailGuessPoints: value }))}
					onCommit={() => commit()}
				/>
			</section>

			<section className="flex flex-col gap-3 rounded-lg border border-border/50 bg-black/10 p-3">
				<div>
					<h3 className="text-sm font-semibold text-text/82">Hardcore reward</h3>
					<p className="mt-1 text-xs text-text/55">Choose one reward mode for hardcore players.</p>
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<ChoiceButton
						value="none"
						current={values.hardcoreRewardMode}
						label="No bonus"
						disabled={disabled}
						onChange={(value) => updateAndCommit({ ...values, hardcoreRewardMode: value })}
					/>
					<ChoiceButton
						value="startBonus"
						current={values.hardcoreRewardMode}
						label="Start bonus"
						disabled={disabled}
						onChange={(value) => updateAndCommit({ ...values, hardcoreRewardMode: value })}
					/>
					<ChoiceButton
						value="multiplier"
						current={values.hardcoreRewardMode}
						label="Multiplier"
						disabled={disabled}
						onChange={(value) => updateAndCommit({ ...values, hardcoreRewardMode: value })}
					/>
				</div>
				{values.hardcoreRewardMode === "startBonus" && (
					<NumberField
						label="Start bonus"
						value={values.hardcoreStartBonusPoints}
						min="0"
						max="100"
						step="0.5"
						disabled={disabled}
						onChange={(value) => setValues((current) => ({ ...current, hardcoreStartBonusPoints: value }))}
						onCommit={() => commit()}
					/>
				)}
				{values.hardcoreRewardMode === "multiplier" && (
					<NumberField
						label="Multiplier"
						value={values.hardcoreMultiplier}
						min="1"
						max="10"
						step="0.1"
						disabled={disabled}
						onChange={(value) => setValues((current) => ({ ...current, hardcoreMultiplier: value }))}
						onCommit={() => commit()}
					/>
				)}
			</section>

			<section className="flex flex-col gap-3 rounded-lg border border-border/50 bg-black/10 p-3">
				<h3 className="text-sm font-semibold text-text/82">Theme rules</h3>
				<div className="grid gap-3 sm:grid-cols-2">
					<NumberField
						label="Guesses per song"
						value={values.themeGuessesPerSong}
						min="1"
						max="3"
						disabled={disabled}
						onChange={(value) => setValues((current) => ({ ...current, themeGuessesPerSong: value }))}
						onCommit={() => commit()}
					/>
					<NumberField
						label="Correct theme points"
						value={values.themeCorrectPoints}
						min="0"
						max="100"
						disabled={disabled}
						onChange={(value) => setValues((current) => ({ ...current, themeCorrectPoints: value }))}
						onCommit={() => commit()}
					/>
				</div>
				<label className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-text/78">
					<input
						type="checkbox"
						className="h-4 w-4 accent-secondary"
						checked={values.firstCorrectThemeBonusEnabled}
						disabled={disabled}
						onChange={(event) =>
							updateAndCommit({
								...values,
								firstCorrectThemeBonusEnabled: event.target.checked,
							})
						}
					/>
					First correct theme guess gets bonus
				</label>
				{values.firstCorrectThemeBonusEnabled && (
					<NumberField
						label="First correct points"
						value={values.firstCorrectThemePoints}
						min="0"
						max="100"
						disabled={disabled}
						onChange={(value) => setValues((current) => ({ ...current, firstCorrectThemePoints: value }))}
						onCommit={() => commit()}
					/>
				)}
			</section>

			<section className="flex flex-col gap-3 rounded-lg border border-border/50 bg-black/10 p-3">
				<h3 className="text-sm font-semibold text-text/82">Tiebreaker</h3>
				<div className="grid gap-2 sm:grid-cols-2">
					<ChoiceButton
						value="none"
						current={values.tieBreaker}
						label="None"
						disabled={disabled}
						onChange={(value) => updateAndCommit({ ...values, tieBreaker: value })}
					/>
					<ChoiceButton
						value="fastestCorrectLocks"
						current={values.tieBreaker}
						label="Most fastest correct locks"
						disabled={disabled}
						onChange={(value) => updateAndCommit({ ...values, tieBreaker: value })}
					/>
				</div>
			</section>

			<div className="flex justify-end">
				<Button
					type="button"
					variant="primary"
					size="sm"
					disabled={disabled}
					onClick={() => commit(values, onSaved)}
				>
					Save settings
				</Button>
			</div>
		</div>
	);
}
