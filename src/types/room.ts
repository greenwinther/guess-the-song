export type Player = {
	id: number;
	name: string;
	roomId: number;
};

export type Song = {
	id: number;
	url: string;
	submitter: string;
	roomId: number;
	title: string;
};

export type Room = {
	id: number;
	code: string;
	theme: string;
	backgroundUrl?: string | null;
	players: Player[];
	songs: Song[];
};
