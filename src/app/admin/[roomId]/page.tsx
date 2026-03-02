import AdminViewClient from "@/components/AdminViewClient";

export default async function AdminRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
	const { roomId } = await params;
	return <AdminViewClient roomId={roomId} />;
}
