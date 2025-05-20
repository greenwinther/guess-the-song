//src/types/socket.ts
import { Player, Song } from "./game";

export interface HostCreateRoomPayload {
	roomId: string;
	songs: Song[];
}

export interface JoinRoomPayload {
	roomId: string;
	player: Player;
}

export interface HostRejoinPayload {
	roomId: string;
}

export type JoinSuccessPayload = {
	roomId: string;
	player: Player;
};
