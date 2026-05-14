import GameProviderLayout from "@/components/shared/GameProviderLayout";

export default function HostRoomLayout({ children }: { children: React.ReactNode }) {
	return <GameProviderLayout>{children}</GameProviderLayout>;
}
