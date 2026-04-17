// src/components/home/components/HostStatusSlot.tsx
import styles from "@/components/home/home.module.css";

export default function HostStatusSlot({ label }: { label: string }) {
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
