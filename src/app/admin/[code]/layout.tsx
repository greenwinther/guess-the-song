import { GameProvider } from "@/contexts/gameContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return <GameProvider>{children}</GameProvider>;
}
