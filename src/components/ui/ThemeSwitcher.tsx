// src/components/ui/ThemeSwitcher.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

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

	useEffect(() => {
		const saved = (localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? "midnight";
		setTheme(saved);
		document.documentElement.dataset.theme = saved;
	}, []);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, theme);
		document.documentElement.dataset.theme = theme;
	}, [theme]);

	const label = useMemo(() => themes.find((t) => t.id === theme)?.label ?? "Theme", [theme]);
	return (
		<div className="fixed top-4 right-8 z-50">
			<button
				className="rounded-full border border-border bg-card/80 px-3 py-2 text-xs uppercase tracking-widest text-text/80 shadow-lg backdrop-blur hover:bg-card"
				onClick={() => setOpen((prev) => !prev)}
				aria-expanded={open}
				aria-haspopup="menu"
			>
				Theme: {label}
			</button>
			{open && (
				<div className="mt-2 rounded-xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur">
					{themes.map((t) => (
						<button
							key={t.id}
							className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
								t.id === theme ? "bg-primary/20 text-text" : "text-text/80 hover:bg-card"
							}`}
							onClick={() => {
								setTheme(t.id);
								setOpen(false);
							}}
						>
							{t.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
