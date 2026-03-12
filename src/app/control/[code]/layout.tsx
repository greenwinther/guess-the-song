import { GameProvider } from "@/contexts/gameContext";

export default function ControlRoomLayout({ children }: { children: React.ReactNode }) {
	return <GameProvider>{children}</GameProvider>;
}
