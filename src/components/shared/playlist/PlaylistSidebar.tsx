import type { ReactNode } from "react";
import { RIGHT_PLAYLIST_PANEL_CLASS } from "@/components/shared/layout/panelClassNames";

type PlaylistSidebarProps = {
	children: ReactNode;
	footer?: ReactNode;
	hasItems?: boolean;
	emptyMessage?: string;
	title?: string;
	useSongArtworkBackground?: boolean;
	onToggleSongArtworkBackground?: () => void;
};

export default function PlaylistSidebar({
	children,
	footer,
	hasItems = true,
	emptyMessage,
	title = "Playlist",
	useSongArtworkBackground,
	onToggleSongArtworkBackground,
}: PlaylistSidebarProps) {
	return (
		<aside className={`${RIGHT_PLAYLIST_PANEL_CLASS} gap-4`}>
			<div className="flex items-start justify-between gap-3 pt-1">
				<h2 className="text-lg sm:text-xl font-semibold text-text">{title}</h2>
				{onToggleSongArtworkBackground && (
					<button
						type="button"
						className="shrink-0 rounded-md border border-border/55 bg-card/25 px-1 py-1 text-[11px] text-text/80 transition-colors hover:bg-card/40 hover:text-text"
						onClick={onToggleSongArtworkBackground}
					>
						{useSongArtworkBackground ? "Artwork: On" : "Artwork: Off"}
					</button>
				)}
			</div>

			<div className="scrollbar-hidden min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg bg-black/15 px-2 py-2 shadow-[inset_0_2px_6px_rgb(0_0_0/0.32),inset_0_1px_0_rgb(255_255_255/0.03)]">
				{!hasItems && emptyMessage ? (
					<div className="rounded-md px-3 py-4 text-sm text-text-muted">{emptyMessage}</div>
				) : (
					children
				)}
			</div>

			{footer}
		</aside>
	);
}
