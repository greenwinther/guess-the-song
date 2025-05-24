//src/types/socket.ts
import { Player, Song, Room } from "./game";

export interface HostCreateRoomPayload {
	code: string;
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
	room: Room;
	player: Player;
};
