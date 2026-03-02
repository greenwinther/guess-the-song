import type { AvatarConfig } from "@/types/avatar";

export type Member = {
	id: number;
	name: string;
	isHost: boolean;
	roomId: number;
	hardcore?: boolean;
	ready?: boolean;
	connected?: boolean;
	avatar?: AvatarConfig;
};
