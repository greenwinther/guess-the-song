// src/app/host/[code]/page.tsx
import HostLobbyClient from "@/component/HostLobbyClient";
import { getRoom } from "@/lib/rooms";

export default async function HostLobbyPage({ params }: { params: { code: string } }) {
	const room = await getRoom(params.code);

	// Coalesce null into undefined so it matches RoomState.backgroundUrl?: string
	const initialRoom = {
		...room,
		backgroundUrl: room.backgroundUrl ?? undefined,
	};

	return <HostLobbyClient initialRoom={initialRoom} />;
}
