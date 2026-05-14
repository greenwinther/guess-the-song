import { GameProvider } from "@/contexts/gameContext";

export default function GameProviderLayout({ children }: { children: React.ReactNode }) {
	return <GameProvider>{children}</GameProvider>;
}
