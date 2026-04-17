// src/components/home/HostInsetSlot.tsx
import styles from "@/components/home/home.module.css";

export default function HostInsetSlot({ label }: { label: string }) {
	return (
		<div className={`${styles.hostInsetSlot} flex items-center justify-center overflow-hidden`} aria-hidden="true">
			<div className={styles.hostInsetSlotContent}>
				<span className={styles.hostInsetSlotDot} />
				<span>{label}</span>
				<span className={styles.hostInsetSlotDot} />
			</div>
		</div>
	);
}
