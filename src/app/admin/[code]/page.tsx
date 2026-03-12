import AdminViewClient from "@/components/AdminViewClient";

export default async function AdminRoomPage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	return <AdminViewClient roomCode={code} />;
}
