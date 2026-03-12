import { redirect } from "next/navigation";

type PageProps = {
	params: Promise<{ code: string }>;
	searchParams: Promise<{ name?: string | string[] }>;
};

export default async function JoinLobbyPage({ params, searchParams }: PageProps) {
	const { code } = await params;
	const { name } = await searchParams;
	const playerName = Array.isArray(name) ? name[0] : name;
	const query = new URLSearchParams();

	if (playerName) {
		query.set("name", playerName);
	}

	redirect(`/play/${code}${query.size ? `?${query.toString()}` : ""}`);
}
