import type { AvatarConfig } from "@/types/avatar";

export type AvatarLayer = "base" | "hair" | "headwear" | "eyes" | "mouth";

export type AvatarAsset = {
	id: string;
	src: string;
};

export type LayerTransition = {
	direction: 1 | -1;
	fromSrc: string;
	toSrc: string;
	key: number;
};

export const AVATAR_STORAGE_KEY = "gts-avatar-v2";
export const LAYER_TRANSITION_MS = 220;

const makeRange = (prefix: string, count: number, pad = 2): AvatarAsset[] =>
	Array.from({ length: count }, (_, index) => ({
		id: `${prefix}-${String(index + 1).padStart(pad, "0")}`,
		src: `/avatars/${prefix}/${prefix}-${String(index + 1).padStart(pad, "0")}.png`,
	}));

export const avatarAssets = {
	base: makeRange("base", 16),
	eyes: makeRange("eyes", 20),
	mouth: makeRange("mouth", 10),
	hair: [{ id: "empty", src: "/avatars/hair/empty.png" }, ...makeRange("hair", 22)],
	headwear: [{ id: "empty", src: "/avatars/headwear/empty.png" }, ...makeRange("headwear", 12)],
} as const;

export const avatarLayerControls: { key: AvatarLayer; label: string }[] = [
	{ key: "headwear", label: "Hat" },
	{ key: "hair", label: "Hair" },
	{ key: "eyes", label: "Eyes" },
	{ key: "mouth", label: "Mouth" },
	{ key: "base", label: "Body" },
];

export const avatarRenderOrder: AvatarLayer[] = ["base", "eyes", "hair", "headwear", "mouth"];

export const defaultAvatar: AvatarConfig = {
	base: avatarAssets.base[0].id,
	hair: "empty",
	eyes: avatarAssets.eyes[0].id,
	mouth: avatarAssets.mouth[0].id,
	headwear: "empty",
};

const resolveId = (list: readonly AvatarAsset[], value: string | undefined) => {
	const fallback = list[0]?.id ?? "";
	if (!value || value === "empty") return fallback;
	return list.some((item) => item.id === value) ? value : fallback;
};

const resolveOptionalId = (list: readonly AvatarAsset[], value: string | undefined) => {
	if (!value || value === "empty") return "empty";
	return list.some((item) => item.id === value) ? value : "empty";
};

export const normalizeAvatar = (parsed: AvatarConfig): AvatarConfig => ({
	base: resolveId(avatarAssets.base, parsed.base),
	hair: resolveOptionalId(avatarAssets.hair, parsed.hair),
	eyes: resolveId(avatarAssets.eyes, parsed.eyes),
	mouth: resolveId(avatarAssets.mouth, parsed.mouth),
	headwear: resolveOptionalId(avatarAssets.headwear, parsed.headwear),
});

export const getAvatarLayerSrc = (layer: AvatarLayer, id: string) =>
	avatarAssets[layer].find((item) => item.id === id)?.src ?? "";

export const getAvatarLayerSrcs = (config: AvatarConfig): Record<AvatarLayer, string> => ({
	base: getAvatarLayerSrc("base", config.base),
	hair: getAvatarLayerSrc("hair", config.hair),
	headwear: getAvatarLayerSrc("headwear", config.headwear),
	eyes: getAvatarLayerSrc("eyes", config.eyes),
	mouth: getAvatarLayerSrc("mouth", config.mouth),
});

export const cycleAvatarLayer = (
	layer: AvatarLayer,
	currentId: string,
	direction: 1 | -1,
) => {
	const list = avatarAssets[layer];
	const currentIndex = Math.max(
		0,
		list.findIndex((item) => item.id === currentId),
	);
	const nextIndex = (currentIndex + direction + list.length) % list.length;
	return list[nextIndex].id;
};

const pickRandom = (list: readonly AvatarAsset[]) => list[Math.floor(Math.random() * list.length)].id;

export const randomAvatarConfig = (): AvatarConfig => ({
	base: pickRandom(avatarAssets.base),
	hair: pickRandom(avatarAssets.hair),
	headwear: pickRandom(avatarAssets.headwear),
	eyes: pickRandom(avatarAssets.eyes),
	mouth: pickRandom(avatarAssets.mouth),
});
