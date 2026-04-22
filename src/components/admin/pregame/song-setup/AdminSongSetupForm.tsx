"use client";

import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { useAdminSongSetupForm } from "@/hooks/admin/useAdminSongSetupForm";
import type { Submission } from "@/types/submission";
import AdminSongSearchResults from "./AdminSongSearchResults";

interface AdminSongSetupFormProps {
	code: string;
	defaultSubmitter?: string;
	onUrlChange?: (url: string) => void;
	showDetailAnswer?: boolean;
	disabled?: boolean;
	editingSong?: Submission | null;
	onFinishEditing?: () => void;
}

export default function AdminSongSetupForm({
	code,
	defaultSubmitter = "",
	onUrlChange,
	showDetailAnswer = true,
	disabled = false,
	editingSong = null,
	onFinishEditing,
}: AdminSongSetupFormProps) {
	const form = useAdminSongSetupForm({
		code,
		defaultSubmitter,
		onUrlChange,
		showDetailAnswer,
		disabled,
		editingSong,
		onFinishEditing,
	});

	return (
		<form onSubmit={form.handleSubmit} className="relative flex flex-wrap items-start gap-2">
			<div className="min-w-[16rem] flex-[2.3]">
				<Input
					placeholder="Search or paste YouTube URL"
					value={form.songInputValue}
					variant={form.urlError ? "error" : "default"}
					onChange={(event) => form.handleSongInputChange(event.target.value)}
					className="w-full"
				/>
			</div>

			<div className="min-w-[9rem] flex-1">
				<Input
					placeholder="Submitter"
					value={form.submitter}
					variant={form.submitterError ? "error" : "default"}
					onChange={(event) => form.handleSubmitterChange(event.target.value)}
					className="w-full"
				/>
			</div>

			{showDetailAnswer && (
				<div className="min-w-[13rem] flex-[1.4]">
					<Input
						placeholder="Bonus answer (optional)"
						value={form.detailAnswer}
						variant={form.detailError ? "error" : "default"}
						onChange={(event) => form.handleDetailAnswerChange(event.target.value)}
						className="w-full"
					/>
				</div>
			)}

			<Button type="submit" disabled={disabled}>
				{form.isEditing ? "Save Song" : "Add Song"}
			</Button>
			{form.isEditing && (
				<Button type="button" variant="secondary" disabled={disabled} onClick={form.handleRemove}>
					Remove
				</Button>
			)}

			{form.errorMessage && (
				<div className="w-full text-xs text-red-400" aria-live="polite">
					{form.errorMessage}
				</div>
			)}

			<AdminSongSearchResults
				results={form.searchResults}
				onSelect={form.handleSearchResultSelect}
			/>
		</form>
	);
}
