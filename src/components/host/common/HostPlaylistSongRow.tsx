import type { Submission } from "@/types/submission";
import type { SongGuessStats } from "@/types/socket";

type HostPlaylistSongRowProps = {
	guessStats?: SongGuessStats;
	hasDetailQuestion: boolean;
	index: number;
	isCurrent: boolean;
	isDetailRevealed: boolean;
	isSubmitterRevealed: boolean;
	isTitleRevealed: boolean;
	onOpenGuessStats?: (song: Submission) => void;
	onSelect?: (song: Submission) => void;
	song: Submission;
};

export default function HostPlaylistSongRow({
	guessStats,
	hasDetailQuestion,
	index,
	isCurrent,
	isDetailRevealed,
	isSubmitterRevealed,
	isTitleRevealed,
	onOpenGuessStats,
	onSelect,
	song,
}: HostPlaylistSongRowProps) {
	const canShowGuessStats = Boolean(guessStats && onOpenGuessStats);
	const handleRowClick = () => {
		if (canShowGuessStats) {
			onOpenGuessStats?.(song);
			return;
		}
		onSelect?.(song);
	};
	const canClickRow = canShowGuessStats || Boolean(onSelect);

	return (
		<button
			type="button"
			onClick={handleRowClick}
			disabled={!canClickRow}
			className={`w-full rounded-md border px-3 py-2 text-left text-text shadow-[inset_0_1px_0_rgb(255_255_255/0.035)] transition ${
				isCurrent
					? "border-primary bg-primary/15"
					: canClickRow
						? "border-border/70 bg-card/45 hover:border-secondary/50 hover:bg-card/60 focus:outline-none focus:ring-2 focus:ring-secondary/45"
						: "border-border/70 bg-card/45"
			} ${canClickRow ? "cursor-pointer" : "cursor-default"}`}
		>
			<div className="space-y-1">
				<div className="min-w-0 flex-1">
					<div className="flex min-w-0 items-start gap-2">
						<span className="shrink-0 font-mono text-xs text-secondary sm:text-sm">{index + 1}.</span>
						<span className="min-w-0 text-xs font-medium leading-snug sm:text-sm">
							{isTitleRevealed ? (song.title ?? song.url) : "Guess the song"}
						</span>
					</div>

					{isSubmitterRevealed && (
						<div className="mt-0.5 text-xs text-text sm:text-sm">
							Submitted by <span className="font-semibold">{song.submitter ?? "Unknown"}</span>
						</div>
					)}
					{hasDetailQuestion && song.detailAnswer && isDetailRevealed && (
						<div className="mt-0.5 text-xs text-text sm:text-sm">
							<span className="text-text-muted">Answer:</span>{" "}
							<span className="font-semibold">{song.detailAnswer}</span>
						</div>
					)}
				</div>
				{canShowGuessStats && guessStats && (
					<span
						className="inline-flex w-fit items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-[0.68rem] font-bold leading-none text-emerald-200 sm:text-xs"
						title="View guess details"
					>
						{guessStats.correctGuessers.length}/{guessStats.totalPlayers} correct
						<span className="ml-1 text-emerald-100/80">Press for more info</span>
					</span>
				)}
			</div>
		</button>
	);
}
