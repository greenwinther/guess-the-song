"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import Button from "@/components/shared/Button";
import type { Room } from "@/types/room";
import { FiChevronDown } from "react-icons/fi";

type ExportedSong = {
	url: string;
	submitter: string;
	title: string;
	detailAnswer?: string;
};

type LobbySetupExportV1 = {
	version: 1;
	exportedAt: string;
	source: {
		code: string;
	};
	setup: {
		theme: string;
		detailQuestion: string;
		hardcoreRequired: boolean;
		songs: ExportedSong[];
	};
};

const isExportedSong = (value: unknown): value is ExportedSong => {
	if (!value || typeof value !== "object") return false;
	const song = value as Record<string, unknown>;
	return (
		typeof song.url === "string" &&
		typeof song.submitter === "string" &&
		typeof song.title === "string" &&
		(song.detailAnswer === undefined || typeof song.detailAnswer === "string")
	);
};

const parseImportedSetup = (raw: string): LobbySetupExportV1 => {
	const parsed = JSON.parse(raw) as unknown;
	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid setup file.");
	}

	const data = parsed as Record<string, unknown>;
	if (data.version !== 1) {
		throw new Error("Unsupported setup file version.");
	}

	const setup = data.setup as Record<string, unknown> | undefined;
	if (!setup || typeof setup !== "object" || !Array.isArray(setup.songs)) {
		throw new Error("Missing setup data.");
	}

	if (
		typeof setup.theme !== "string" ||
		typeof setup.detailQuestion !== "string" ||
		typeof setup.hardcoreRequired !== "boolean" ||
		!setup.songs.every(isExportedSong)
	) {
		throw new Error("Setup file has an invalid shape.");
	}

	return {
		version: 1,
		exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : new Date().toISOString(),
		source: {
			code:
				typeof (data.source as Record<string, unknown> | undefined)?.code === "string"
					? ((data.source as Record<string, unknown>).code as string)
					: "",
		},
		setup: {
			theme: setup.theme,
			detailQuestion: setup.detailQuestion,
			hardcoreRequired: setup.hardcoreRequired,
			songs: setup.songs,
		},
	};
};

const emitWithResult = <TResult,>(
	invoke: (cb: (result: TResult) => void) => void,
): Promise<TResult> =>
	new Promise((resolve) => {
		invoke(resolve);
	});

export default function AdminSetupTransferControls({
	room,
	inLobby,
	onImportComplete,
	label = "Manage",
	className = "",
}: {
	room: Room;
	inLobby: boolean;
	onImportComplete?: () => void;
	label?: string;
	className?: string;
}) {
	const socket = useSocket();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [importing, setImporting] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		window.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("keydown", handleEscape);

		return () => {
			window.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	const handleExport = () => {
		const payload: LobbySetupExportV1 = {
			version: 1,
			exportedAt: new Date().toISOString(),
			source: { code: room.code },
			setup: {
				theme: room.theme ?? "",
				detailQuestion: room.detailQuestion ?? "",
				hardcoreRequired: !!room.hardcoreRequired,
				songs: room.songs.map((song) => ({
					url: song.url,
					submitter: song.submitter,
					title: song.title ?? "",
					detailAnswer: song.detailAnswer ?? "",
				})),
			},
		};

		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `guess-the-song-setup-${room.code.toLowerCase()}.json`;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
		setOpen(false);
	};

	const handleImportClick = () => {
		if (!inLobby || importing) return;
		setOpen(false);
		fileInputRef.current?.click();
	};

	const handleImportFile = async (file: File) => {
		const text = await file.text();
		const imported = parseImportedSetup(text);

		if (
			room.songs.length > 0 ||
			(room.theme ?? "").trim() ||
			(room.detailQuestion ?? "").trim() ||
			room.hardcoreRequired
		) {
			const confirmed = window.confirm(
				"Importing will replace the current lobby setup, including songs, theme, and detail question. Continue?",
			);
			if (!confirmed) return;
		}

		setImporting(true);
		onImportComplete?.();

		try {
			for (const song of [...room.songs]) {
				const result = await emitWithResult<{ success: boolean; error?: string }>((cb) =>
					socket.emit("removeSong", { code: room.code, songId: song.id }, cb),
				);
				if (!result.success) {
					throw new Error(result.error || "Could not clear existing songs.");
				}
			}

			const hardcoreOk = await emitWithResult<boolean>((cb) =>
				socket.emit("HARDCORE_REQUIRED", { code: room.code, required: imported.setup.hardcoreRequired }, cb),
			);
			if (!hardcoreOk) {
				throw new Error("Could not update hardcore mode.");
			}

			socket.emit("THEME_EDIT", { code: room.code, theme: imported.setup.theme });
			socket.emit("DETAIL_QUESTION", { code: room.code, question: imported.setup.detailQuestion });

			for (const song of imported.setup.songs) {
				const result = await emitWithResult<{ success: boolean; error?: string }>((cb) =>
					socket.emit(
						"addSong",
						{
							code: room.code,
							url: song.url,
							submitter: song.submitter,
							title: song.title,
							detailAnswer: song.detailAnswer ?? "",
						},
						cb,
					),
				);
				if (!result.success) {
					throw new Error(result.error || `Could not import song "${song.title || song.url}".`);
				}
			}
		} finally {
			setImporting(false);
		}
	};

	return (
		<>
			<div ref={containerRef} className="relative inline-block">
				<Button
					variant="secondary"
					size="sm"
					className={className}
					onClick={() => setOpen((prev) => !prev)}
					aria-expanded={open}
					aria-haspopup="menu"
					disabled={importing}
				>
					{label}
					<FiChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
				</Button>
				{open && (
					<div
						className="absolute left-1/2 top-full z-20 mt-2 w-full min-w-full -translate-x-1/2 rounded-xl border border-border/80 bg-card/95 shadow-[0_18px_42px_rgba(0,0,0,0.34)] backdrop-blur-xl"
						role="menu"
					>
						<button
							type="button"
							className="flex w-full items-center justify-center whitespace-nowrap rounded-lg px-2 py-1.5 text-center text-sm text-text/85 transition-colors hover:bg-white/5 hover:text-text"
							onClick={handleExport}
							role="menuitem"
						>
							Export setup
						</button>
						<button
							type="button"
							className="flex w-full items-center justify-center whitespace-nowrap rounded-lg px-2 py-1.5 text-center text-sm text-text/85 transition-colors hover:bg-white/5 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
							onClick={handleImportClick}
							disabled={!inLobby || importing}
							role="menuitem"
						>
							{importing ? "Importing..." : "Import setup"}
						</button>
					</div>
				)}
			</div>
			<input
				ref={fileInputRef}
				type="file"
				accept="application/json,.json"
				className="hidden"
				onChange={async (event) => {
					const file = event.target.files?.[0];
					event.currentTarget.value = "";
					if (!file) return;
					try {
						await handleImportFile(file);
					} catch (error) {
						alert(error instanceof Error ? error.message : "Could not import setup.");
					}
				}}
			/>
		</>
	);
}
