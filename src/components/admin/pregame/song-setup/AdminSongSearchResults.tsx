import Image from "next/image";
import type { AdminSongSearchResult } from "@/hooks/admin/useAdminSongSearch";

type AdminSongSearchResultsProps = {
	results: AdminSongSearchResult[];
	onSelect: (video: AdminSongSearchResult) => void;
};

export default function AdminSongSearchResults({
	results,
	onSelect,
}: AdminSongSearchResultsProps) {
	if (results.length === 0) return null;

	return (
		<ul
			className={`
        absolute left-0 top-full w-full
        z-10 bg-card bg-opacity-80 border border-border
        mt-1 max-h-60 overflow-auto rounded
      `}
		>
			{results.map((video) => (
				<li
					key={video.id.videoId}
					onClick={() => onSelect(video)}
					className="p-2 hover:bg-card hover:bg-opacity-60 cursor-pointer flex items-center space-x-2"
				>
					<Image
						src={video.snippet.thumbnails.default.url}
						alt={`Thumbnail for ${video.snippet.title}`}
						width={40}
						height={40}
						className="object-cover rounded flex-shrink-0"
					/>
					<span className="text-text">{video.snippet.title}</span>
				</li>
			))}
		</ul>
	);
}
