// src/components/ui/AvatarPicker.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

const resolveId = (list: { id: string }[], value: string | undefined) => {
	const fallback = list[0]?.id ?? "";
	if (!value || value === "empty") return fallback;
	return list.some((item) => item.id === value) ? value : fallback;
};

const resolveOptionalId = (list: { id: string }[], value: string | undefined) => {
	if (!value || value === "empty") return "empty";
	return list.some((item) => item.id === value) ? value : "empty";
};

type AvatarLayer = "base" | "hair" | "headwear" | "eyes" | "mouth";

export default function AvatarPicker({ onChange }: { onChange?: (cfg: AvatarConfig) => void }) {
	const [config, setConfig] = useState<AvatarConfig>(defaultAvatar);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as AvatarConfig;
			if (!parsed?.base) return;
			setConfig({
				base: resolveId(bases, parsed.base),
				hair: resolveOptionalId(hair, parsed.hair),
				eyes: resolveId(eyes, parsed.eyes),
				mouth: resolveId(mouths, parsed.mouth),
				headwear: resolveOptionalId(headwears, parsed.headwear),
			});
		} catch {}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		} catch {}
		onChange?.(config);
	}, [config, onChange]);

	const baseSrc = useMemo(() => bases.find((b) => b.id === config.base)?.src ?? "", [config.base]);
	const hairSrc = useMemo(() => hair.find((h) => h.id === config.hair)?.src ?? "", [config.hair]);
	const eyeSrc = useMemo(() => eyes.find((e) => e.id === config.eyes)?.src ?? "", [config.eyes]);
	const mouthSrc = useMemo(() => mouths.find((m) => m.id === config.mouth)?.src ?? "", [config.mouth]);
	const headwearSrc = useMemo(
		() => headwears.find((h) => h.id === config.headwear)?.src ?? "",
		[config.headwear],
	);

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

	const cycleLayer = (layer: AvatarLayer, dir: 1 | -1) => {
		setConfig((c) => {
			if (layer === "base") return { ...c, base: cycle(bases, c.base, (b) => b.id, dir) };
			if (layer === "hair") return { ...c, hair: cycle(hair, c.hair, (h) => h.id, dir) };
			if (layer === "headwear") {
				return { ...c, headwear: cycle(headwears, c.headwear, (h) => h.id, dir) };
			}
			if (layer === "eyes") return { ...c, eyes: cycle(eyes, c.eyes, (e) => e.id, dir) };
			return { ...c, mouth: cycle(mouths, c.mouth, (m) => m.id, dir) };
		});
	};

	const layers: { key: AvatarLayer; label: string }[] = [
		{ key: "headwear", label: "Hat" },
		{ key: "hair", label: "Hair" },
		{ key: "base", label: "Base" },
		{ key: "eyes", label: "Eyes" },
		{ key: "mouth", label: "Mouth" },
	];

	const LayerButton = ({ dir, layer, label }: { dir: 1 | -1; layer: AvatarLayer; label: string }) => (
		<button
			onClick={() => cycleLayer(layer, dir)}
			className="h-8 w-8 rounded-md border border-border bg-card/40 text-base leading-none text-text/80 backdrop-blur hover:bg-card/60"
			aria-label={`${dir === -1 ? "Previous" : "Next"} ${label}`}
			title={`${dir === -1 ? "Previous" : "Next"} ${label}`}
		>
			{dir === -1 ? "<" : ">"}
		</button>
	);

	const layerImageClass = "absolute inset-0 object-contain pointer-events-none";
	return (
		<div className="w-full flex flex-col items-center gap-1">
			<div className="w-full mt-0 flex items-center justify-center gap-2">
				<div className="flex shrink-0 flex-col gap-2">
					{layers.map((layer) => (
						<LayerButton
							key={`prev-${layer.key}`}
							dir={-1}
							layer={layer.key}
							label={layer.label}
						/>
					))}
				</div>

				<div className="w-48 h-48 shrink-0 flex items-center justify-center">
					<div className="relative w-48 h-48">
						{baseSrc && (
							<Image src={baseSrc} alt="" fill sizes="192px" className={layerImageClass} />
						)}
						{eyeSrc && (
							<Image src={eyeSrc} alt="" fill sizes="192px" className={layerImageClass} />
						)}
						{hairSrc && (
							<Image src={hairSrc} alt="" fill sizes="192px" className={layerImageClass} />
						)}
						{headwearSrc && (
							<Image src={headwearSrc} alt="" fill sizes="192px" className={layerImageClass} />
						)}
						{mouthSrc && (
							<Image src={mouthSrc} alt="" fill sizes="192px" className={layerImageClass} />
						)}
					</div>
				</div>

				<div className="flex shrink-0 flex-col gap-2">
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

			<button
				type="button"
				onClick={() =>
					setConfig({
						base: pick(bases, (b) => b.id),
						hair: pick(hair, (h) => h.id),
						headwear: pick(headwears, (h) => h.id),
						eyes: pick(eyes, (e) => e.id),
						mouth: pick(mouths, (m) => m.id),
					})
				}
				className="text-xs uppercase tracking-widest text-text/80 hover:text-text border border-border rounded-md px-3 py-1 bg-card/40 backdrop-blur hover:bg-card/60"
				title="Randomize avatar"
			>
				Randomize
			</button>
		</div>
	);
}
