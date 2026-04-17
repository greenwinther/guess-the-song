// src/components/admin/AdminStateNotice.tsx

import styles from "@/components/admin/admin.module.css";

export default function AdminStateNotice({ message }: { message: string }) {
	return (
		<main className="grid min-h-screen place-items-center bg-gradient-to-br from-bg via-bg to-secondary p-6">
			<div
				className={`${styles.stateCard} rounded-2xl border border-border/80 p-6 text-text backdrop-blur-2xl`}
			>
				{message}
			</div>
		</main>
	);
}
