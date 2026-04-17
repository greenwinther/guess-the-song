// src/hooks/player/useDetailOrder.ts
import { useEffect } from "react";
import { shuffleArray } from "@/utils/shuffleArray";
import type { Room } from "@/types/room";
import type { OrderItem } from "@/components/player/components/GuessOrderList";
import { useLocalStorageState } from "./useLocalStorageState";

export function useDetailOrder(code: string, room: Room | null, playerName: string) {
	const safeName = (playerName?.trim() || "player").toLowerCase();
	const [order, setOrder] = useLocalStorageState<OrderItem[]>(`detail-order-${code}-${safeName}`, []);
	const [submitted, setSubmitted] = useLocalStorageState<boolean>(
		`detail-submitted-${code}-${safeName}`,
		false
	);

	useEffect(() => {
		if (!room) return;
		const hasDetailQuestion =
			!!room.detailQuestion && room.songs.every((s) => (s.detailAnswer ?? "").trim().length > 0);
		if (!hasDetailQuestion) return;
		if (order.length || submitted) return;
		const detailList = room.songs.map((s) => ({ id: s.id, name: s.detailAnswer ?? "" }));
		setOrder(shuffleArray(detailList));
	}, [room, order.length, submitted, setOrder]);

	const handleReorder = (newOrder: OrderItem[]) => setOrder(newOrder);

	return { order, setOrder, submitted, setSubmitted, handleReorder };
}
