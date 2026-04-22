"use client";

import clsx from "clsx";
import type { CSSProperties, Ref } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AvatarLayerButton from "@/components/home/components/avatar/AvatarLayerButton";
import AvatarPreview from "@/components/home/components/avatar/AvatarPreview";
import AvatarRandomizeButton from "@/components/home/components/avatar/AvatarRandomizeButton";
import {
	AVATAR_STORAGE_KEY,
	LAYER_TRANSITION_MS,
	avatarLayerControls,
	cycleAvatarLayer,
	defaultAvatar,
	getAvatarLayerSrc,
	getAvatarLayerSrcs,
	normalizeAvatar,
	randomAvatarConfig,
	type AvatarLayer,
	type LayerTransition,
} from "@/components/home/components/avatar/avatarOptions";

import type { AvatarConfig } from "@/types/avatar";

export { default as DiceIcon } from "@/components/home/components/avatar/DiceIcon";

let cachedAvatarConfig: AvatarConfig | null = null;

const getStoredAvatar = (): AvatarConfig => {
	if (typeof window === "undefined") return defaultAvatar;
	try {
		const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
		if (!raw) return defaultAvatar;
		const parsed = JSON.parse(raw) as AvatarConfig;
		if (!parsed?.base) return defaultAvatar;
		const normalized = normalizeAvatar(parsed);
		cachedAvatarConfig = normalized;
		return normalized;
	} catch {
		return defaultAvatar;
	}
};

const createEmptyTransitions = (): Record<AvatarLayer, LayerTransition | null> => ({
	base: null,
	hair: null,
	headwear: null,
	eyes: null,
	mouth: null,
});

type AvatarPickerProps = {
	className?: string;
	compact?: boolean;
	onChange?: (cfg: AvatarConfig) => void;
	previewClassName?: string;
	previewRef?: Ref<HTMLDivElement>;
	previewStyle?: CSSProperties;
	randomizeSignal?: number;
	showRandomizeButton?: boolean;
};

export default function AvatarPicker({
	onChange,
	compact = false,
	className,
	showRandomizeButton = true,
	randomizeSignal,
	previewRef,
	previewStyle,
	previewClassName,
}: AvatarPickerProps) {
	const [config, setConfig] = useState<AvatarConfig>(() => cachedAvatarConfig ?? defaultAvatar);
	const [isHydrated, setIsHydrated] = useState(false);
	const [layerTransitions, setLayerTransitions] =
		useState<Record<AvatarLayer, LayerTransition | null>>(createEmptyTransitions);
	const transitionTimers = useRef<Partial<Record<AvatarLayer, ReturnType<typeof setTimeout>>>>({});
	const previousRandomizeSignal = useRef<number | undefined>(randomizeSignal);

	useEffect(() => {
		const storedAvatar = getStoredAvatar();
		setConfig(storedAvatar);
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!isHydrated) return;
		cachedAvatarConfig = config;
		try {
			localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(config));
		} catch {}
		onChange?.(config);
	}, [config, isHydrated, onChange]);

	useEffect(() => {
		const timers = transitionTimers.current;
		return () => {
			for (const timer of Object.values(timers)) {
				if (timer) clearTimeout(timer);
			}
		};
	}, []);

	const layerSrcs = useMemo(() => getAvatarLayerSrcs(config), [config]);

	const scheduleTransitionCleanup = (layer: AvatarLayer) => {
		const existingTimer = transitionTimers.current[layer];
		if (existingTimer) clearTimeout(existingTimer);
		transitionTimers.current[layer] = setTimeout(() => {
			setLayerTransitions((current) => ({ ...current, [layer]: null }));
			delete transitionTimers.current[layer];
		}, LAYER_TRANSITION_MS);
	};

	const randomizeAvatar = useCallback(() => {
		setConfig(randomAvatarConfig());
	}, []);

	useEffect(() => {
		if (!isHydrated) return;
		if (randomizeSignal === undefined || previousRandomizeSignal.current === randomizeSignal) return;
		previousRandomizeSignal.current = randomizeSignal;
		randomizeAvatar();
	}, [isHydrated, randomizeAvatar, randomizeSignal]);

	const cycleLayer = (layer: AvatarLayer, direction: 1 | -1) => {
		setConfig((current) => {
			const nextLayerId = cycleAvatarLayer(layer, current[layer], direction);
			const nextTransition = {
				direction,
				fromSrc: getAvatarLayerSrc(layer, current[layer]),
				toSrc: getAvatarLayerSrc(layer, nextLayerId),
				key: Date.now(),
			};

			if (nextTransition.fromSrc !== nextTransition.toSrc) {
				setLayerTransitions((activeTransitions) => ({
					...activeTransitions,
					[layer]: nextTransition,
				}));
				scheduleTransitionCleanup(layer);
			}

			return { ...current, [layer]: nextLayerId };
		});
	};

	return (
		<div className={clsx("flex w-full flex-col items-center gap-0", className)}>
			<div className="flex w-full items-center justify-between gap-0">
				<div className="flex shrink-0 flex-col gap-0">
					{avatarLayerControls.map((layer) => (
						<AvatarLayerButton
							key={`prev-${layer.key}`}
							compact={compact}
							direction={-1}
							layer={layer.key}
							label={layer.label}
							onCycleLayer={cycleLayer}
						/>
					))}
				</div>

				<AvatarPreview
					compact={compact}
					layerSrcs={layerSrcs}
					previewClassName={previewClassName}
					previewRef={previewRef}
					previewStyle={previewStyle}
					transitions={layerTransitions}
				/>

				<div className="flex shrink-0 flex-col gap-0">
					{avatarLayerControls.map((layer) => (
						<AvatarLayerButton
							key={`next-${layer.key}`}
							compact={compact}
							direction={1}
							layer={layer.key}
							label={layer.label}
							onCycleLayer={cycleLayer}
						/>
					))}
				</div>
			</div>

			{showRandomizeButton && <AvatarRandomizeButton onClick={randomizeAvatar} />}
		</div>
	);
}
