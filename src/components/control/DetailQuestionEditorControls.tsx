// src/components/control/DetailQuestionEditorControls.tsx
"use client";
import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useRoomState } from "@/contexts/gameContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type DetailQuestionEditorControlsProps = {
	code?: string;
	detailQuestion?: string;
	disabled?: boolean;
};

export function DetailQuestionEditorControls({
	code,
	detailQuestion,
	disabled = false,
}: DetailQuestionEditorControlsProps) {
	const socket = useSocket();
	const { room } = useRoomState();
	const resolvedCode = code ?? room?.code;
	const resolvedQuestion = detailQuestion ?? room?.detailQuestion ?? "";

	const [value, setValue] = useState(resolvedQuestion);

	useEffect(() => {
		setValue(resolvedQuestion);
	}, [resolvedQuestion]);

	const handleSave = useCallback(() => {
		if (!resolvedCode || disabled) return;
		const trimmed = (value ?? "").trim();
		socket.emit("DETAIL_QUESTION", { code: resolvedCode, question: trimmed });
	}, [disabled, resolvedCode, value, socket]);

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			setValue(resolvedQuestion);
		}
	};

	if (!resolvedCode) return null;

	return (
		<div className="flex w-full flex-col gap-3">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold text-text">Detail question</h3>
				<p className="text-xs text-text/70">Prompt shown alongside each song for the bonus detail lane.</p>
			</div>
			<div className="flex flex-col items-start gap-2 sm:flex-row">
				<Input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					size="md"
					variant="default"
					className="w-full bg-card text-text placeholder:text-text-muted sm:flex-1"
					placeholder="Detail question (e.g., Year released)"
					disabled={disabled}
				/>
				<Button
					variant="primary"
					size="md"
					onClick={handleSave}
					disabled={disabled}
					className="relative z-10 w-full shrink-0 sm:w-auto"
				>
					Save question
				</Button>
			</div>
		</div>
	);
}

