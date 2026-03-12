import { redirect } from "next/navigation";

type PageProps = {
	params: Promise<{ code: string }>;
};

export default async function HostLobbyPage({ params }: PageProps) {
	const { code } = await params;
	redirect(`/control/${code}`);
}
