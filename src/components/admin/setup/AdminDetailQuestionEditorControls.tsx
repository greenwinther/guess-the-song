// src/components/control/DetailQuestionEditorControls.tsx
"use client";
import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useRoomState } from "@/contexts/gameContext";
import Input from "@/components/shared/Input";

type AdminDetailQuestionEditorControlsProps = {
	code?: string;
	detailQuestion?: string;
	disabled?: boolean;
};

export default function AdminDetailQuestionEditorControls({
	code,
	detailQuestion,
	disabled = false,
}: AdminDetailQuestionEditorControlsProps) {
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
		if (trimmed === resolvedQuestion.trim()) return;
		socket.emit("DETAIL_QUESTION", { code: resolvedCode, question: trimmed });
	}, [disabled, resolvedCode, resolvedQuestion, value, socket]);

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
		<div className="flex w-full items-center gap-3">
			<label className="shrink-0 text-base font-medium text-text/78">Bonus quest</label>
			<Input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onBlur={handleSave}
				onKeyDown={handleKeyDown}
				size="md"
				variant="default"
				className="flex-1 bg-card text-text"
				placeholder="Bonus quest (e.g., Year released)"
				disabled={disabled}
			/>
		</div>
	);
}

