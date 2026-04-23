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
			className={`w-full rounded-md border px-3 py-2 text-left text-text shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] transition-colors ${
				isCurrent
					? "border-primary bg-primary/15"
					: onSelect
						? "border-border/70 bg-card/45 hover:bg-card/60"
						: "border-border/70 bg-card/45"
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
