"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { firstFieldIssue, songSubmitFormSchema } from "@/shared/schemas";
import type { Submission } from "@/types/submission";
import type { FormEvent } from "react";
import type { AdminSongSearchResult } from "./useAdminSongSearch";
import { useAdminSongSearch } from "./useAdminSongSearch";

type UseAdminSongSetupFormOptions = {
	code: string;
	defaultSubmitter?: string;
	onUrlChange?: (url: string) => void;
	showDetailAnswer?: boolean;
	disabled?: boolean;
	editingSong?: Submission | null;
	onFinishEditing?: () => void;
};

export function useAdminSongSetupForm({
	code,
	defaultSubmitter = "",
	onUrlChange,
	showDetailAnswer = true,
	disabled = false,
	editingSong = null,
	onFinishEditing,
}: UseAdminSongSetupFormOptions) {
	const socket = useSocket();
	const {
		resetSongSearch,
		searchError,
		searchResults,
		selectSearchResult,
		songInputValue,
		title,
		updateSongInput,
		url,
	} = useAdminSongSearch({ onUrlChange });
	const [submitter, setSubmitter] = useState(defaultSubmitter);
	const [detailAnswer, setDetailAnswer] = useState("");
	const [urlError, setUrlError] = useState<string | null>(null);
	const [submitterError, setSubmitterError] = useState<string | null>(null);
	const [detailError, setDetailError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		if (editingSong) {
			resetSongSearch({
				nextUrl: editingSong.url,
				nextTitle: editingSong.title ?? "",
			});
			setSubmitter(editingSong.submitter);
			setDetailAnswer(editingSong.detailAnswer ?? "");
			setUrlError(null);
			setSubmitterError(null);
			setDetailError(null);
			setSubmitError(null);
			return;
		}

		resetSongSearch();
		setSubmitter(defaultSubmitter);
		setDetailAnswer("");
	}, [defaultSubmitter, editingSong, resetSongSearch]);

	const resetErrors = () => {
		setUrlError(null);
		setSubmitterError(null);
		setDetailError(null);
		setSubmitError(null);
	};

	const resetForm = () => {
		resetSongSearch();
		setSubmitter(defaultSubmitter);
		setDetailAnswer("");
		resetErrors();
		onFinishEditing?.();
	};

	const handleSongInputChange = (value: string) => {
		if (disabled) return;
		updateSongInput(value);
		setUrlError(null);
		setSubmitError(null);
	};

	const handleSearchResultSelect = (video: AdminSongSearchResult) => {
		if (disabled) return;
		selectSearchResult(video);
		setUrlError(null);
		setSubmitError(null);
	};

	const handleSubmitterChange = (value: string) => {
		if (disabled) return;
		setSubmitter(value);
		setSubmitterError(null);
		setSubmitError(null);
	};

	const handleDetailAnswerChange = (value: string) => {
		if (disabled) return;
		setDetailAnswer(value);
		setDetailError(null);
		setSubmitError(null);
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (disabled) return;

		resetErrors();

		const validation = songSubmitFormSchema.safeParse({
			url,
			submitter,
			detailAnswer: showDetailAnswer ? detailAnswer : "",
		});

		if (!validation.success) {
			setUrlError(firstFieldIssue(validation.error, "url"));
			setSubmitterError(firstFieldIssue(validation.error, "submitter"));
			setDetailError(firstFieldIssue(validation.error, "detailAnswer"));
			setSubmitError("Please fix the highlighted fields.");
			return;
		}

		if (editingSong) {
			socket.emit(
				"updateSong",
				{
					code,
					songId: editingSong.id,
					url: validation.data.url,
					submitter: validation.data.submitter,
					title,
					detailAnswer: showDetailAnswer ? validation.data.detailAnswer : "",
				},
				(res) => {
					if (!res?.success) {
						setSubmitError(res?.error || "Could not update song");
						return;
					}
					resetForm();
				},
			);
			return;
		}

		socket.emit(
			"addSong",
			{
				code,
				url: validation.data.url,
				submitter: validation.data.submitter,
				title,
				detailAnswer: showDetailAnswer ? validation.data.detailAnswer : "",
			},
			(res) => {
				if (!res?.success) {
					setSubmitError(res?.error || "Could not add song");
					return;
				}
				resetForm();
			},
		);
	};

	const handleRemove = () => {
		if (disabled || !editingSong) return;

		setSubmitError(null);
		socket.emit("removeSong", { code, songId: editingSong.id }, (res) => {
			if (!res?.success) {
				setSubmitError(res?.error || "Could not remove song");
				return;
			}
			onFinishEditing?.();
		});
	};

	return {
		detailAnswer,
		detailError,
		errorMessage: urlError || submitterError || detailError || submitError || searchError,
		isEditing: Boolean(editingSong),
		searchResults,
		songInputValue,
		submitter,
		submitterError,
		urlError,
		handleDetailAnswerChange,
		handleRemove,
		handleSearchResultSelect,
		handleSongInputChange,
		handleSubmit,
		handleSubmitterChange,
	};
}
