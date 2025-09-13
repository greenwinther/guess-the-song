// src/components/join/RightSidebarPlaylist.tsx
import type { Song } from "@/types/room";

export default function RightSidebarPlaylist({
	songs,
	revealedIds,
}: {
	songs: Song[];
	revealedIds: number[];
}) {
	return (
		<aside className="order-2 lg:order-none w-full lg:col-span-3 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-border flex flex-col">
			<h2 className="text-lg sm:text-xl font-semibold text-text mb-3 sm:mb-4">Playlist</h2>
			<div className="space-y-2 flex-1 overflow-y-auto">
				{songs.map((s, idx) => (
					<div
						key={s.id}
						className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-card hover:bg-border text-text"
					>
						<span className="text-secondary font-mono">{idx + 1}.</span>
						<span>{revealedIds.includes(s.id) ? s.title ?? s.url : "Click to reveal song"}</span>
					</div>
				))}
			</div>
		</aside>
	);
}
