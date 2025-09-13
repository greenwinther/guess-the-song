// src/hooks/join/useSubmissionOrder.ts
import { useEffect, useMemo, useState } from "react";
import { shuffleArray } from "@/utils/shuffelArray";
import type { Room } from "@/types/room";
import type { OrderItem } from "@/components/join/SubmissionOrderList";
import { useLocalStorageState } from "./useLocalStorageState";

export function useSubmissionOrder(code: string, room: Room | null) {
	const [order, setOrder] = useLocalStorageState<OrderItem[]>(`order-${code}`, []);
	const [submitted, setSubmitted] = useLocalStorageState<boolean>(`submitted-${code}`, false);

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
