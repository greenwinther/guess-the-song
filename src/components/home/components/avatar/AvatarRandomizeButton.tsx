"use client";

import DiceIcon from "@/components/home/components/avatar/DiceIcon";

type AvatarRandomizeButtonProps = {
	onClick: () => void;
};

export default function AvatarRandomizeButton({ onClick }: AvatarRandomizeButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex items-center gap-2 rounded-full border border-border bg-card/35 px-3 py-1.5 text-sm text-[color:var(--color-text-muted)] backdrop-blur transition-all duration-150 hover:border-secondary/45 hover:bg-card/55 hover:text-[color:var(--color-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70"
			title="Randomize avatar"
			aria-label="Randomize avatar"
		>
			<DiceIcon className="h-5 w-5" />
			<span>Randomize</span>
		</button>
	);
}
