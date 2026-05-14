"use client";

import Button from "@/components/shared/Button";
import AdminBrandLink from "./AdminBrandLink";
import styles from "@/components/admin/admin.module.css";
import type { Room } from "@/types/room";

type AdminHeaderProps = {
	roomCode: string;
	phase?: Room["phase"] | null;
	hostLink?: string | null;
	onOpenSettings?: () => void;
};

export default function AdminHeader({
	roomCode,
	phase = null,
	hostLink = null,
	onOpenSettings,
}: AdminHeaderProps) {
	return (
		<header
			className={`${styles.panel} ${styles.panelOpen} ${styles.panelPrimary} ${styles.adminHeader} z-20 grid items-center gap-4 rounded-b-2xl border border-border/70 border-t-0 p-4 md:grid-cols-[1fr_auto_1fr]`}
		>
			<div aria-hidden="true" />
			<AdminBrandLink className="justify-self-start text-center md:justify-self-center" />
			<div className="flex items-center gap-2 self-end justify-self-end">
				{onOpenSettings && (
					<Button
						variant="secondary"
						size="sm"
						className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
						onClick={onOpenSettings}
					>
						Settings
					</Button>
				)}
				{hostLink && (
					<>
						<Button
							variant="secondary"
							size="sm"
							className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
							onClick={async () => {
								try {
									await navigator.clipboard.writeText(`${window.location.origin}${hostLink}`);
								} catch {}
							}}
						>
							Copy host link
						</Button>
						<Button
							variant="secondary"
							size="sm"
							className="border-border/45 bg-card/10 text-text/78 hover:bg-card/18 hover:text-text"
							onClick={() => window.open(hostLink, "_blank", "noopener,noreferrer")}
						>
							Open host control
						</Button>
					</>
				)}
			</div>
			<span className={styles.phaseBadge}>Phase {phase ?? "LOBBY"}</span>
		</header>
	);
}
