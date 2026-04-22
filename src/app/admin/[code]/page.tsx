import AdminPageClient from "@/components/admin/AdminPageClient";

export default async function AdminRoomPage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	return <AdminPageClient roomCode={code} />;
}
