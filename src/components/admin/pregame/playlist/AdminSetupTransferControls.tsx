"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/shared/Button";
import type { Room } from "@/types/room";
import { FiChevronDown } from "react-icons/fi";
import { useAdminSetupImport } from "@/hooks/admin/useAdminSetupImport";
import { buildAdminSetupExport, getAdminSetupFilename } from "./adminSetupTransfer";

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
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [open, setOpen] = useState(false);
	const { importing, importSetupFile } = useAdminSetupImport({ room, onImportComplete });

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
		const payload = buildAdminSetupExport(room);
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = getAdminSetupFilename(room.code);
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
						await importSetupFile(file);
					} catch (error) {
						toast.error(error instanceof Error ? error.message : "Could not import setup.");
					}
				}}
			/>
		</>
	);
}
