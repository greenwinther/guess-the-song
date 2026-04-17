"use client";

import clsx from "clsx";
import styles from "@/components/home/home.module.css";

export default function HomeHero() {
	return (
		<div className="flex w-fit max-w-full flex-col items-center gap-4 pb-2">
			<h1
				className="
					inline-flex w-fit max-w-full text-center
					text-[2.68rem] sm:text-[2.8rem] font-extrabold tracking-[-0.03em]
					leading-[1.08]
				"
			>
				<span
					className={clsx(
						styles.homeTitle,
						styles.homeTitleText,
						"text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary",
					)}
					data-text="Guess the Song"
				>
					Guess the Song
				</span>
			</h1>
			<div className={styles.homeTitleDivider} aria-hidden="true" />
		</div>
	);
}
