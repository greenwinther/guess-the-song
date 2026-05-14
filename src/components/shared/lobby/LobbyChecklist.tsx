import type { IconType } from "react-icons";

type LobbyChecklistItem = {
	icon: IconType;
	label: string;
	value: string;
	complete: boolean;
	completeIcon?: IconType;
};

type LobbyChecklistProps = {
	items: LobbyChecklistItem[];
};

export default function LobbyChecklist({ items }: LobbyChecklistProps) {
	return (
		<div className="grid w-full max-w-[31rem] grid-cols-1 gap-2">
			{items.map((item) => {
				const Icon = item.complete && item.completeIcon ? item.completeIcon : item.icon;

				return (
					<div
						key={item.label}
						className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/30 px-3 py-2 text-left shadow-[inset_0_1px_0_rgb(255_255_255/0.035)]"
					>
						<span
							className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
								item.complete
									? "border-emerald-400/45 bg-emerald-500/15 text-emerald-200"
									: "border-border/70 bg-black/10 text-text-muted"
							}`}
						>
							<Icon className="h-3.5 w-3.5" aria-hidden="true" />
						</span>
						<span className="min-w-0">
							<span className="block text-sm font-semibold text-text">{item.label}</span>
							<span className="block text-xs text-text-muted">{item.value}</span>
						</span>
					</div>
				);
			})}
		</div>
	);
}
