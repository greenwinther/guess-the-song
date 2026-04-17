// src/components/ui/ThemeSwitcher.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { LuPalette } from "react-icons/lu";

type ThemeId = "midnight" | "sunset" | "rose-gold" | "citrus" | "violet-storm";

const themes: Array<{ id: ThemeId; label: string }> = [
	{ id: "midnight", label: "Midnight" },
	{ id: "sunset", label: "Sunset" },
	{ id: "rose-gold", label: "Rose Gold" },
	{ id: "citrus", label: "Citrus" },
	{ id: "violet-storm", label: "Violet Storm" },
];

const STORAGE_KEY = "gts-theme";

export default function ThemeSwitcher() {
	const [open, setOpen] = useState(false);
	const [theme, setTheme] = useState<ThemeId>("midnight");
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const saved = (localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? "midnight";
		setTheme(saved);
		document.documentElement.dataset.theme = saved;
	}, []);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, theme);
		document.documentElement.dataset.theme = theme;
	}, [theme]);

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

	const label = useMemo(() => themes.find((t) => t.id === theme)?.label ?? "Theme", [theme]);
	return (
		<div ref={containerRef} className="fixed right-4 top-4 z-50 inline-block sm:right-6 sm:top-5">
			<button
				type="button"
				className={clsx(
					"inline-flex w-full items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2",
					"text-xs font-semibold uppercase tracking-[0.22em] text-text shadow-[0_10px_26px_rgba(0,0,0,0.32)] backdrop-blur-xl",
					"transition duration-150 ease-out hover:border-primary/35 hover:bg-card hover:text-text motion-safe:hover:scale-[1.03]",
					"focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 focus-visible:ring-offset-0",
					open && "border-primary/45 bg-card text-text shadow-[0_12px_28px_rgba(0,0,0,0.34)]",
				)}
				onClick={() => setOpen((prev) => !prev)}
				aria-expanded={open}
				aria-haspopup="menu"
				aria-label={`Select theme. Current theme: ${label}`}
			>
				<LuPalette className="h-3.5 w-3.5" aria-hidden="true" />
				<span className="hidden text-text-muted/90 sm:inline">Theme</span>
				<span>{label}</span>
				<FiChevronDown
					className={clsx("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")}
					aria-hidden="true"
				/>
			</button>
			{open && (
				<div
					className="absolute right-0 top-full mt-2 w-full min-w-full rounded-2xl border border-border/80 bg-card/95 p-2 shadow-[0_18px_42px_rgba(0,0,0,0.34)] backdrop-blur-xl"
					role="menu"
				>
					{themes.map((t) => (
						<button
							key={t.id}
							type="button"
							className={clsx(
								"flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150",
								t.id === theme
									? "bg-primary/18 text-text"
									: "text-text/80 hover:bg-white/5 hover:text-text",
							)}
							onClick={() => {
								setTheme(t.id);
								setOpen(false);
							}}
							role="menuitemradio"
							aria-checked={t.id === theme}
						>
							<span>{t.label}</span>
							{t.id === theme && <FiCheck className="h-4 w-4 text-secondary" aria-hidden="true" />}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
