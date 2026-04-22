"use client";

type PlayerLobbySettingToggleProps = {
	checked: boolean;
	description: string;
	disabled?: boolean;
	id: string;
	label: string;
	onChange: (checked: boolean) => void;
};

export default function PlayerLobbySettingToggle({
	checked,
	description,
	disabled = false,
	id,
	label,
	onChange,
}: PlayerLobbySettingToggleProps) {
	return (
		<label
			htmlFor={id}
			className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/35 px-4 py-3"
		>
			<div className="min-w-0">
				<div className="text-sm font-semibold text-text">{label}</div>
				<div className="mt-1 text-xs text-text/60">{description}</div>
			</div>
			<input
				id={id}
				type="checkbox"
				className="h-5 w-5 shrink-0 accent-primary"
				checked={checked}
				disabled={disabled}
				onChange={(event) => onChange(event.target.checked)}
			/>
		</label>
	);
}
