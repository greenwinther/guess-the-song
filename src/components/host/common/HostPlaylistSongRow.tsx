import type { Submission } from "@/types/submission";

type HostPlaylistSongRowProps = {
	hasDetailQuestion: boolean;
	index: number;
	isCurrent: boolean;
	isDetailRevealed: boolean;
	isSubmitterRevealed: boolean;
	isTitleRevealed: boolean;
	onSelect?: (song: Submission) => void;
	song: Submission;
};

export default function HostPlaylistSongRow({
	hasDetailQuestion,
	index,
	isCurrent,
	isDetailRevealed,
	isSubmitterRevealed,
	isTitleRevealed,
	onSelect,
	song,
}: HostPlaylistSongRowProps) {
	return (
		<button
			onClick={() => onSelect?.(song)}
			disabled={!onSelect}
			className={`w-full text-left rounded-lg border border-border px-3 py-2 transition ${
				isCurrent ? "bg-primary/15 border-primary" : onSelect ? "bg-card/50 hover:bg-card/70" : "bg-card/50"
			}`}
		>
			<div className="flex items-center gap-2">
				<span className="font-mono text-secondary text-xs sm:text-sm">{index + 1}.</span>
				<span className="font-medium text-sm sm:text-base">
					{isTitleRevealed ? song.title ?? song.url : "Guess the song"}
				</span>
			</div>

			{isSubmitterRevealed && (
				<div className="mt-0.5 text-xs sm:text-sm text-text">
					Submitted by <span className="font-semibold">{song.submitter ?? "Unknown"}</span>
				</div>
			)}
			{hasDetailQuestion && song.detailAnswer && isDetailRevealed && (
				<div className="mt-0.5 text-xs sm:text-sm text-text">
					<span className="text-text-muted">Answer:</span>{" "}
					<span className="font-semibold">{song.detailAnswer}</span>
				</div>
			)}
		</button>
	);
}
