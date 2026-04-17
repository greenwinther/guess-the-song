// src/hooks/player/useSubmissionOrder.ts
import { useEffect } from "react";
import { shuffleArray } from "@/utils/shuffleArray";
import type { Room } from "@/types/room";
import type { OrderItem } from "@/components/player/components/GuessOrderList";
import { useLocalStorageState } from "./useLocalStorageState";

export function useSubmissionOrder(code: string, room: Room | null, playerName: string) {
	const safeName = (playerName?.trim() || "player").toLowerCase();
	const [order, setOrder] = useLocalStorageState<OrderItem[]>(`order-${code}-${safeName}`, []);
	const [submitted, setSubmitted] = useLocalStorageState<boolean>(`submitted-${code}-${safeName}`, false);

	// initialize once when room arrives & never shuffled before
	useEffect(() => {
		if (!room) return;
		if (order.length || submitted) return;
		const submitterList = room.songs.map((s) => ({ id: s.id, name: s.submitter }));
		setOrder(shuffleArray(submitterList));
	}, [room, order.length, submitted, setOrder]);

	const handleReorder = (newOrder: OrderItem[]) => setOrder(newOrder);

	return { order, setOrder, submitted, setSubmitted, handleReorder };
}
