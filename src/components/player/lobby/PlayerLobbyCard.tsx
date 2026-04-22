"use client";

import RoomPlayerList from "@/components/shared/RoomPlayerList";
import PlayerLobbySettingToggle from "@/components/player/lobby/PlayerLobbySettingToggle";

import type { Room } from "@/types/room";

type PlayerLobbyCardProps = {
	hardcore: boolean;
	onHardcoreChange: (checked: boolean) => void;
	onReadyChange: (checked: boolean) => void;
	ready: boolean;
	room: Room;
	submittedPlayers: string[];
};

export default function PlayerLobbyCard({
	hardcore,
	onHardcoreChange,
	onReadyChange,
	ready,
	room,
	submittedPlayers,
}: PlayerLobbyCardProps) {
	return (
		<div className="mx-auto w-full max-w-2xl">
			<div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/25 p-6 backdrop-blur-xl">
				<h2 className="text-2xl font-semibold text-text text-center">Waiting for the game to start</h2>
				<div className="rounded-lg border border-border bg-card/50 p-3 text-center">
					<p className="text-xs text-text-muted">Room code</p>
					<p className="text-3xl font-mono font-bold text-secondary">{room.code}</p>
				</div>

				{room.hardcoreRequired && (
					<div className="w-full rounded-lg border border-border bg-card/60 p-3 text-sm text-text">
						Hardcore mode is required in this room.
					</div>
				)}

				<PlayerLobbySettingToggle
					id="player-hardcore"
					label="Hardcore mode"
					description={room.hardcoreRequired ? "Locked by host" : "More difficult, higher reward"}
					checked={room.hardcoreRequired ? true : hardcore}
					disabled={room.hardcoreRequired}
					onChange={onHardcoreChange}
				/>

				<PlayerLobbySettingToggle
					id="player-ready"
					label="Ready"
					description="Let the host know you are ready to play"
					checked={ready}
					onChange={onReadyChange}
				/>

				<div className="rounded-xl border border-border bg-card/35 p-4">
					<RoomPlayerList players={room.players} submittedPlayers={submittedPlayers} />
				</div>
			</div>
		</div>
	);
}
