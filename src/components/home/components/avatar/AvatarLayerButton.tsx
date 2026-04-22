"use client";

import clsx from "clsx";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

import type { AvatarLayer } from "@/components/home/components/avatar/avatarOptions";

type AvatarLayerButtonProps = {
	compact: boolean;
	direction: 1 | -1;
	label: string;
	layer: AvatarLayer;
	onCycleLayer: (layer: AvatarLayer, direction: 1 | -1) => void;
};

export default function AvatarLayerButton({
	compact,
	direction,
	label,
	layer,
	onCycleLayer,
}: AvatarLayerButtonProps) {
	return (
		<button
			type="button"
			onClick={() => onCycleLayer(layer, direction)}
			className={clsx(
				"flex items-center rounded-full text-text/75 transition-colors duration-150 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70",
				direction === -1 ? "justify-start" : "justify-end",
				compact ? "h-8 w-8" : "h-9 w-9",
			)}
			aria-label={`${direction === -1 ? "Previous" : "Next"} ${label}`}
			title={`${direction === -1 ? "Previous" : "Next"} ${label}`}
		>
			{direction === -1 ? (
				<FiArrowLeft
					className={compact ? "h-[1.15rem] w-[1.15rem]" : "h-5 w-5"}
					style={{ strokeWidth: 2.75 }}
					aria-hidden="true"
				/>
			) : (
				<FiArrowRight
					className={compact ? "h-[1.15rem] w-[1.15rem]" : "h-5 w-5"}
					style={{ strokeWidth: 2.75 }}
					aria-hidden="true"
				/>
			)}
		</button>
	);
}
