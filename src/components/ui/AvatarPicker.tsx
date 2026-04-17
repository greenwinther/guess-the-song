// src/components/ui/AvatarPicker.tsx
"use client";
import clsx from "clsx";
import { CSSProperties, Ref, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import type { AvatarConfig } from "@/types/avatar";

const STORAGE_KEY = "gts-avatar-v2";

const makeRange = (prefix: string, count: number, pad = 2) =>
	Array.from({ length: count }, (_, i) => ({
		id: `${prefix}-${String(i + 1).padStart(pad, "0")}`,
		src: `/avatars/${prefix}/${prefix}-${String(i + 1).padStart(pad, "0")}.png`,
	}));

const bases = makeRange("base", 16);
const eyes = makeRange("eyes", 20);
const mouths = makeRange("mouth", 10);
const hair = [{ id: "empty", src: "/avatars/hair/empty.png" }, ...makeRange("hair", 22)];
const headwears = [{ id: "empty", src: "/avatars/headwear/empty.png" }, ...makeRange("headwear", 12)];

const defaultAvatar: AvatarConfig = {
	base: bases[0].id,
	hair: "empty",
	eyes: eyes[0].id,
	mouth: mouths[0].id,
	headwear: "empty",
};
let cachedAvatarConfig: AvatarConfig | null = null;

const resolveId = (list: { id: string }[], value: string | undefined) => {
	const fallback = list[0]?.id ?? "";
	if (!value || value === "empty") return fallback;
	return list.some((item) => item.id === value) ? value : fallback;
};

const resolveOptionalId = (list: { id: string }[], value: string | undefined) => {
	if (!value || value === "empty") return "empty";
	return list.some((item) => item.id === value) ? value : "empty";
};

const normalizeAvatar = (parsed: AvatarConfig): AvatarConfig => ({
	base: resolveId(bases, parsed.base),
	hair: resolveOptionalId(hair, parsed.hair),
	eyes: resolveId(eyes, parsed.eyes),
	mouth: resolveId(mouths, parsed.mouth),
	headwear: resolveOptionalId(headwears, parsed.headwear),
});

const getStoredAvatar = (): AvatarConfig => {
	if (typeof window === "undefined") return defaultAvatar;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
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

type AvatarLayer = "base" | "hair" | "headwear" | "eyes" | "mouth";
type LayerTransition = {
	direction: 1 | -1;
	fromSrc: string;
	toSrc: string;
	key: number;
};

const LAYER_TRANSITION_MS = 220;

export function DiceIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 512 512"
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			stroke="currentColor"
			className={className}
			aria-hidden="true"
		>
			<path d="M255.76 44.764c-6.176 0-12.353 1.384-17.137 4.152L85.87 137.276c-9.57 5.536-9.57 14.29 0 19.826l152.753 88.36c9.57 5.536 24.703 5.536 34.272 0l152.753-88.36c9.57-5.535 9.57-14.29 0-19.825l-152.753-88.36c-4.785-2.77-10.96-4.153-17.135-4.153zm-.824 53.11c9.013.097 17.117 2.162 24.31 6.192 4.92 2.758 8.143 5.903 9.666 9.438 1.473 3.507 1.56 8.13.26 13.865l-1.6 5.706c-1.06 4.083-1.28 7.02-.66 8.81.57 1.764 1.983 3.278 4.242 4.544l3.39 1.898-33.235 18.62-3.693-2.067c-4.118-2.306-6.744-4.912-7.883-7.82-1.188-2.935-.99-7.603.594-14.005l1.524-5.748c.887-3.423.973-6.23.26-8.418-.653-2.224-2.134-3.983-4.444-5.277-3.515-1.97-7.726-2.676-12.63-2.123-4.956.526-10.072 2.268-15.35 5.225-4.972 2.785-9.487 6.272-13.55 10.46-4.112 4.162-7.64 8.924-10.587 14.288L171.9 138.21c5.318-5.34 10.543-10.01 15.676-14.013 5.134-4 10.554-7.6 16.262-10.8 14.976-8.39 28.903-13.38 41.78-14.967 3.208-.404 6.315-.59 9.32-.557zm50.757 56.7l26.815 15.024-33.235 18.62-26.816-15.023 33.236-18.62zM75.67 173.84c-5.753-.155-9.664 4.336-9.664 12.28v157.696c0 11.052 7.57 24.163 17.14 29.69l146.93 84.848c9.57 5.526 17.14 1.156 17.14-9.895V290.76c0-11.052-7.57-24.16-17.14-29.688l-146.93-84.847c-2.69-1.555-5.225-2.327-7.476-2.387zm360.773.002c-2.25.06-4.783.83-7.474 2.385l-146.935 84.847c-9.57 5.527-17.14 18.638-17.14 29.69v157.7c0 11.05 7.57 15.418 17.14 9.89L428.97 373.51c9.57-5.527 17.137-18.636 17.137-29.688v-157.7c0-7.942-3.91-12.432-9.664-12.278zm-321.545 63.752c6.553 1.366 12.538 3.038 17.954 5.013 5.415 1.976 10.643 4.417 15.68 7.325 13.213 7.63 23.286 16.324 30.218 26.082 6.932 9.7 10.398 20.046 10.398 31.04 0 5.64-1.055 10.094-3.168 13.364-2.112 3.212-5.714 5.91-10.804 8.094l-5.2 1.92c-3.682 1.442-6.093 2.928-7.23 4.46-1.137 1.472-1.705 3.502-1.705 6.092v3.885l-29.325-16.933v-4.23c0-4.72.892-8.376 2.68-10.97 1.787-2.652 5.552-5.14 11.292-7.467l5.2-2.006c3.087-1.21 5.334-2.732 6.742-4.567 1.46-1.803 2.192-4.028 2.192-6.676 0-4.027-1.3-7.915-3.9-11.66-2.6-3.804-6.227-7.05-10.885-9.74-4.387-2.532-9.126-4.29-14.217-5.272-5.09-1.04-10.398-1.254-15.922-.645v-27.11zm269.54 8.607c1.522 0 2.932.165 4.232.493 6.932 1.696 10.398 8.04 10.398 19.034 0 5.64-1.056 11.314-3.168 17.023-2.112 5.65-5.714 12.507-10.804 20.568l-5.2 7.924c-3.682 5.695-6.093 9.963-7.23 12.807-1.137 2.785-1.705 5.473-1.705 8.063v3.885l-29.325 16.932v-4.23c0-4.72.894-9.41 2.68-14.067 1.79-4.715 5.552-11.55 11.292-20.504l5.2-8.01c3.087-4.776 5.334-8.894 6.742-12.354 1.46-3.492 2.192-6.562 2.192-9.21 0-4.028-1.3-6.414-3.898-7.158-2.6-.8-6.23.142-10.887 2.83-4.387 2.533-9.124 6.25-14.215 11.145-5.09 4.84-10.398 10.752-15.922 17.74v-27.11c6.553-6.2 12.536-11.44 17.95-15.718 5.417-4.278 10.645-7.87 15.68-10.777 10.738-6.2 19.4-9.302 25.99-9.307zm-252.723 94.515l29.326 16.93v30.736l-29.325-16.93v-30.735zm239.246 8.06v30.735l-29.325 16.93v-30.733l29.326-16.932z" />
		</svg>
	);
}

export default function AvatarPicker({
	onChange,
	compact = false,
	className,
	showRandomizeButton = true,
	randomizeSignal,
	previewRef,
	previewStyle,
	previewClassName,
}: {
	onChange?: (cfg: AvatarConfig) => void;
	compact?: boolean;
	className?: string;
	showRandomizeButton?: boolean;
	randomizeSignal?: number;
	previewRef?: Ref<HTMLDivElement>;
	previewStyle?: CSSProperties;
	previewClassName?: string;
}) {
	const [config, setConfig] = useState<AvatarConfig>(() => cachedAvatarConfig ?? defaultAvatar);
	const [isHydrated, setIsHydrated] = useState(false);
	const [layerTransitions, setLayerTransitions] = useState<Record<AvatarLayer, LayerTransition | null>>({
		base: null,
		hair: null,
		headwear: null,
		eyes: null,
		mouth: null,
	});
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
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		} catch {}
		onChange?.(config);
	}, [config, isHydrated, onChange]);

	useEffect(() => {
		const timers = transitionTimers.current;
		return () => {
			for (const timer of Object.values(timers)) {
				if (timer) {
					clearTimeout(timer);
				}
			}
		};
	}, []);

	const baseSrc = useMemo(() => bases.find((b) => b.id === config.base)?.src ?? "", [config.base]);
	const hairSrc = useMemo(() => hair.find((h) => h.id === config.hair)?.src ?? "", [config.hair]);
	const eyeSrc = useMemo(() => eyes.find((e) => e.id === config.eyes)?.src ?? "", [config.eyes]);
	const mouthSrc = useMemo(() => mouths.find((m) => m.id === config.mouth)?.src ?? "", [config.mouth]);
	const headwearSrc = useMemo(
		() => headwears.find((h) => h.id === config.headwear)?.src ?? "",
		[config.headwear],
	);
	const currentLayerSrcs = {
		base: baseSrc,
		hair: hairSrc,
		headwear: headwearSrc,
		eyes: eyeSrc,
		mouth: mouthSrc,
	} as const;

	const cycle = <T,>(list: T[], currentId: string, getId: (item: T) => string, dir: 1 | -1) => {
		const idx = Math.max(
			0,
			list.findIndex((i) => getId(i) === currentId),
		);
		const next = (idx + dir + list.length) % list.length;
		return getId(list[next]);
	};
	const pick = <T,>(list: T[], getId: (item: T) => string) =>
		getId(list[Math.floor(Math.random() * list.length)]);

	const getLayerSrc = (layer: AvatarLayer, id: string) => {
		if (layer === "base") return bases.find((item) => item.id === id)?.src ?? "";
		if (layer === "hair") return hair.find((item) => item.id === id)?.src ?? "";
		if (layer === "headwear") return headwears.find((item) => item.id === id)?.src ?? "";
		if (layer === "eyes") return eyes.find((item) => item.id === id)?.src ?? "";
		return mouths.find((item) => item.id === id)?.src ?? "";
	};

	const scheduleTransitionCleanup = (layer: AvatarLayer) => {
		const existingTimer = transitionTimers.current[layer];
		if (existingTimer) {
			clearTimeout(existingTimer);
		}
		transitionTimers.current[layer] = setTimeout(() => {
			setLayerTransitions((current) => ({ ...current, [layer]: null }));
			delete transitionTimers.current[layer];
		}, LAYER_TRANSITION_MS);
	};

	const randomizeAvatar = useCallback(
		() =>
			setConfig({
				base: pick(bases, (b) => b.id),
				hair: pick(hair, (h) => h.id),
				headwear: pick(headwears, (h) => h.id),
				eyes: pick(eyes, (e) => e.id),
				mouth: pick(mouths, (m) => m.id),
			}),
		[],
	);

	useEffect(() => {
		if (!isHydrated) return;
		if (randomizeSignal === undefined || previousRandomizeSignal.current === randomizeSignal) return;
		previousRandomizeSignal.current = randomizeSignal;
		randomizeAvatar();
	}, [isHydrated, randomizeAvatar, randomizeSignal]);

	const cycleLayer = (layer: AvatarLayer, dir: 1 | -1) => {
		setConfig((c) => {
			if (layer === "base") {
				const nextBase = cycle(bases, c.base, (b) => b.id, dir);
				return { ...c, base: nextBase };
			}
			if (layer === "hair") {
				const nextHair = cycle(hair, c.hair, (h) => h.id, dir);
				const nextTransition = {
					direction: dir,
					fromSrc: getLayerSrc("hair", c.hair),
					toSrc: getLayerSrc("hair", nextHair),
					key: Date.now(),
				};
				if (nextTransition.fromSrc !== nextTransition.toSrc) {
					setLayerTransitions((current) => ({ ...current, hair: nextTransition }));
					scheduleTransitionCleanup("hair");
				}
				return { ...c, hair: nextHair };
			}
			if (layer === "headwear") {
				const nextHeadwear = cycle(headwears, c.headwear, (h) => h.id, dir);
				const nextTransition = {
					direction: dir,
					fromSrc: getLayerSrc("headwear", c.headwear),
					toSrc: getLayerSrc("headwear", nextHeadwear),
					key: Date.now(),
				};
				if (nextTransition.fromSrc !== nextTransition.toSrc) {
					setLayerTransitions((current) => ({ ...current, headwear: nextTransition }));
					scheduleTransitionCleanup("headwear");
				}
				return { ...c, headwear: nextHeadwear };
			}
			if (layer === "eyes") {
				const nextEyes = cycle(eyes, c.eyes, (e) => e.id, dir);
				const nextTransition = {
					direction: dir,
					fromSrc: getLayerSrc("eyes", c.eyes),
					toSrc: getLayerSrc("eyes", nextEyes),
					key: Date.now(),
				};
				if (nextTransition.fromSrc !== nextTransition.toSrc) {
					setLayerTransitions((current) => ({ ...current, eyes: nextTransition }));
					scheduleTransitionCleanup("eyes");
				}
				return { ...c, eyes: nextEyes };
			}
			const nextMouth = cycle(mouths, c.mouth, (m) => m.id, dir);
			const nextTransition = {
				direction: dir,
				fromSrc: getLayerSrc("mouth", c.mouth),
				toSrc: getLayerSrc("mouth", nextMouth),
				key: Date.now(),
			};
			if (nextTransition.fromSrc !== nextTransition.toSrc) {
				setLayerTransitions((current) => ({ ...current, mouth: nextTransition }));
				scheduleTransitionCleanup("mouth");
			}
			return { ...c, mouth: nextMouth };
		});
	};

	const layers: { key: AvatarLayer; label: string }[] = [
		{ key: "headwear", label: "Hat" },
		{ key: "hair", label: "Hair" },
		{ key: "eyes", label: "Eyes" },
		{ key: "mouth", label: "Mouth" },
		{ key: "base", label: "Body" },
	];

	const LayerButton = ({ dir, layer, label }: { dir: 1 | -1; layer: AvatarLayer; label: string }) => (
		<button
			type="button"
			onClick={() => cycleLayer(layer, dir)}
			className={clsx(
				"flex items-center rounded-full text-text/75 transition-colors duration-150 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70",
				dir === -1 ? "justify-start" : "justify-end",
				compact ? "h-8 w-8" : "h-9 w-9",
			)}
			aria-label={`${dir === -1 ? "Previous" : "Next"} ${label}`}
			title={`${dir === -1 ? "Previous" : "Next"} ${label}`}
		>
			{dir === -1 ? (
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

	const layerImageClass = "absolute inset-0 object-contain pointer-events-none";
	const avatarSizeClass = compact ? "w-40 h-40" : "w-48 h-48";
	const renderLayer = (layer: AvatarLayer) => {
		const transition = layerTransitions[layer];
		if (transition) {
			return (
				<div key={`${layer}-${transition.key}`} className="avatar-layer-stage">
					{transition.fromSrc && (
						<Image
							src={transition.fromSrc}
							alt=""
							fill
							sizes={compact ? "160px" : "192px"}
							className={clsx(
								layerImageClass,
								transition.direction === 1 ? "avatar-layer-out-right" : "avatar-layer-out-left",
							)}
						/>
					)}
					{transition.toSrc && (
						<Image
							src={transition.toSrc}
							alt=""
							fill
							sizes={compact ? "160px" : "192px"}
							className={clsx(
								layerImageClass,
								transition.direction === 1 ? "avatar-layer-in-left" : "avatar-layer-in-right",
							)}
						/>
					)}
				</div>
			);
		}

		const src = currentLayerSrcs[layer];
		if (!src) return null;
		return (
			<Image
				key={layer}
				src={src}
				alt=""
				fill
				sizes={compact ? "160px" : "192px"}
				className={layerImageClass}
			/>
		);
	};
	return (
		<div className={clsx("flex w-full flex-col items-center gap-0", className)}>
			<div className="flex w-full items-center justify-between gap-0">
				<div className="flex shrink-0 flex-col gap-0">
					{layers.map((layer) => (
						<LayerButton
							key={`prev-${layer.key}`}
							dir={-1}
							layer={layer.key}
							label={layer.label}
						/>
					))}
				</div>

				<div
					ref={previewRef}
					style={previewStyle}
					className={clsx("relative shrink-0", avatarSizeClass, previewClassName)}
				>
					{renderLayer("base")}
					{renderLayer("eyes")}
					{renderLayer("hair")}
					{renderLayer("headwear")}
					{renderLayer("mouth")}
				</div>

				<div className="flex shrink-0 flex-col gap-0">
					{layers.map((layer) => (
						<LayerButton
							key={`next-${layer.key}`}
							dir={1}
							layer={layer.key}
							label={layer.label}
						/>
					))}
				</div>
			</div>
			{showRandomizeButton && (
				<button
					type="button"
					onClick={randomizeAvatar}
					className="inline-flex items-center gap-2 rounded-full border border-border bg-card/35 px-3 py-1.5 text-sm text-[color:var(--color-text-muted)] backdrop-blur transition-all duration-150 hover:border-secondary/45 hover:bg-card/55 hover:text-[color:var(--color-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70"
					title="Randomize avatar"
					aria-label="Randomize avatar"
				>
					<DiceIcon className="h-5 w-5" />
					<span>Randomize</span>
				</button>
			)}
		</div>
	);
}
