"use client";

import Button from "@/components/shared/Button";
import AdminBrandLink from "./AdminBrandLink";
import styles from "@/components/admin/admin.module.css";

type AdminHeaderProps = {
	roomCode: string;
};

export default function AdminHeader({ roomCode }: AdminHeaderProps) {
	return (
		<header
			className={`${styles.panel} ${styles.panelOpen} ${styles.panelPrimary} z-20 grid items-center gap-4 rounded-b-2xl border border-border/70 border-t-0 p-4 md:grid-cols-[1fr_auto_1fr]`}
		>
			<div />
			<AdminBrandLink className="justify-self-start text-center md:justify-self-center" />
			<div className="self-end justify-self-end">
				<Button
					variant="secondary"
					size="sm"
					className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
					onClick={() => window.open(`/host/${roomCode}`, "_blank", "noopener,noreferrer")}
				>
					Open host control
				</Button>
			</div>
		</header>
	);
}
