import { GameProvider } from "@/contexts/gameContext";

export default function HostRoomLayout({ children }: { children: React.ReactNode }) {
	return <GameProvider>{children}</GameProvider>;
}
