"use client";

import clsx from "clsx";
import Image from "next/image";
import type { CSSProperties, Ref } from "react";

import {
	avatarRenderOrder,
	type AvatarLayer,
	type LayerTransition,
} from "@/components/home/components/avatar/avatarOptions";

type AvatarPreviewProps = {
	compact: boolean;
	layerSrcs: Record<AvatarLayer, string>;
	previewClassName?: string;
	previewRef?: Ref<HTMLDivElement>;
	previewStyle?: CSSProperties;
	transitions: Record<AvatarLayer, LayerTransition | null>;
};

export default function AvatarPreview({
	compact,
	layerSrcs,
	previewClassName,
	previewRef,
	previewStyle,
	transitions,
}: AvatarPreviewProps) {
	const layerImageClass = "absolute inset-0 object-contain pointer-events-none";
	const avatarSizeClass = compact ? "w-40 h-40" : "w-48 h-48";
	const imageSize = compact ? "160px" : "192px";
	const isBaseLayer = (layer: AvatarLayer) => layer === "base";
	const transitionClassNames = (layer: AvatarLayer, direction: 1 | -1) => {
		if (isBaseLayer(layer)) {
			return {
				from: "avatar-layer-fade-out",
				to: "avatar-layer-fade-in",
			};
		}
		return {
			from: direction === 1 ? "avatar-layer-out-right" : "avatar-layer-out-left",
			to: direction === 1 ? "avatar-layer-in-left" : "avatar-layer-in-right",
		};
	};

	const renderLayer = (layer: AvatarLayer) => {
		const transition = transitions[layer];
		if (transition) {
			const transitionClasses = transitionClassNames(layer, transition.direction);
			return (
				<div key={`${layer}-${transition.key}`} className="avatar-layer-stage">
					{transition.fromSrc && (
						<Image
							src={transition.fromSrc}
							alt=""
							fill
							sizes={imageSize}
							priority={isBaseLayer(layer)}
							loading={isBaseLayer(layer) ? "eager" : "lazy"}
							className={clsx(layerImageClass, transitionClasses.from)}
						/>
					)}
					{transition.toSrc && (
						<Image
							src={transition.toSrc}
							alt=""
							fill
							sizes={imageSize}
							priority={isBaseLayer(layer)}
							loading={isBaseLayer(layer) ? "eager" : "lazy"}
							className={clsx(layerImageClass, transitionClasses.to)}
						/>
					)}
				</div>
			);
		}

		const src = layerSrcs[layer];
		if (!src) return null;
		return (
			<Image
				key={layer}
				src={src}
				alt=""
				fill
				sizes={imageSize}
				priority={isBaseLayer(layer)}
				loading={isBaseLayer(layer) ? "eager" : "lazy"}
				className={layerImageClass}
			/>
		);
	};

	return (
		<div
			ref={previewRef}
			style={previewStyle}
			className={clsx("relative shrink-0", avatarSizeClass, previewClassName)}
		>
			{avatarRenderOrder.map((layer) => renderLayer(layer))}
		</div>
	);
}
