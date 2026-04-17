import type { AvatarConfig } from "@/types/avatar";

const AVATAR_STORAGE_KEY = "gts-avatar-v2";

export function getStoredAvatar(): AvatarConfig | null {
	if (typeof window === "undefined") return null;

	try {
		const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as AvatarConfig;
		return parsed?.base ? parsed : null;
	} catch {
		return null;
	}
}
