import { GameProvider } from "@/contexts/gameContext";

export default function JoinRoomLayout({ children }: { children: React.ReactNode }) {
	return <GameProvider>{children}</GameProvider>;
}
