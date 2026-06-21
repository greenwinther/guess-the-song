import { storeDetailOrder, storeOrder } from "@/lib/game";
import type { RoomState } from "@/server/state/roomState";

const devSeededRooms = new Set<string>();

const roomKey = (code: string) => code.toUpperCase();

export function registerDevSeededRoom(code: string) {
	devSeededRooms.add(roomKey(code));
}

export function isDevSeededRoom(code: string) {
	return devSeededRooms.has(roomKey(code));
}

const orderedOptions = (correct: string, options: string[], shouldBeCorrect: boolean) => {
	const unique = Array.from(new Set(options.filter((option) => option.trim().length > 0)));
	if (shouldBeCorrect) {
		return [correct, ...unique.filter((option) => option !== correct)];
	}

	const wrong = unique.find((option) => option !== correct);
	return wrong ? [wrong, ...unique.filter((option) => option !== wrong)] : [];
};

export function seedDevGuessesForRoom(room: RoomState) {
	const players = room.players.filter((player) => !player.isHost);
	if (players.length === 0 || room.songs.length === 0) return;

	const submitterOptions = room.songs.map((song) => song.submitter);
	const hasDetailLane =
		!!room.detailQuestion &&
		room.songs.every((song) => (song.detailAnswer ?? "").trim().length > 0);
	const detailOptions = hasDetailLane
		? room.songs.map((song) => (song.detailAnswer ?? "").trim())
		: [];
	const opportunitiesPerSong = hasDetailLane ? 2 : 1;
	const maxScoreSlots = room.songs.length * opportunitiesPerSong;
	const divisor = Math.max(players.length - 1, 1);

	players.forEach((player, playerIndex) => {
		let remainingCorrect = Math.round(((players.length - 1 - playerIndex) / divisor) * maxScoreSlots);

		for (const song of room.songs) {
			const submitterCorrect = remainingCorrect > 0;
			storeOrder(
				room.code,
				song.id,
				player.name,
				orderedOptions(song.submitter, submitterOptions, submitterCorrect)
			);
			if (submitterCorrect) remainingCorrect--;

			if (!hasDetailLane) continue;
			const detailCorrectAnswer = (song.detailAnswer ?? "").trim();
			const detailCorrect = remainingCorrect > 0;
			storeDetailOrder(
				room.code,
				song.id,
				player.name,
				orderedOptions(detailCorrectAnswer, detailOptions, detailCorrect)
			);
			if (detailCorrect) remainingCorrect--;
		}
	});
}
