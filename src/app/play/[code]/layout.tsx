import { GameProvider } from "@/contexts/gameContext";

export default function PlayRoomLayout({ children }: { children: React.ReactNode }) {
	return <GameProvider>{children}</GameProvider>;
}
