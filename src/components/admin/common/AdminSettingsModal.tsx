"use client";

import { useEffect } from "react";
import Button from "@/components/shared/Button";
import AdminScoringEditor from "@/components/admin/pregame/song-setup/AdminScoringEditor";
import type { Room } from "@/types/room";

type AdminSettingsModalProps = {
	open: boolean;
	room: Room;
	inLobby: boolean;
	onClose: () => void;
};

export default function AdminSettingsModal({
	open,
	room,
	inLobby,
	onClose,
}: AdminSettingsModalProps) {
	useEffect(() => {
		if (!open) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-settings-title"
		>
			<div
				className="w-full max-w-2xl rounded-2xl border border-border/70 bg-card/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.42)]"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<h2 id="admin-settings-title" className="text-xl font-semibold text-text">
							Room settings
						</h2>
						<p className="text-sm text-text/68">
							Adjust how many points songs, bonus answers, theme solves, and hardcore runs award.
						</p>
					</div>
					<Button
						variant="secondary"
						size="sm"
						className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
						onClick={onClose}
					>
						Close
					</Button>
				</div>

				<div className="mt-5 rounded-xl border border-border/60 bg-black/10 px-4 py-4">
					{!inLobby && (
						<div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-100">
							Scoring is read-only once the live game has started.
						</div>
					)}
					<AdminScoringEditor code={room.code} scoring={room.scoring} disabled={!inLobby} />
				</div>
			</div>
		</div>
	);
}
