"use client";

import Link from "next/link";
import clsx from "clsx";

export default function AdminBrandLink({ className = "" }: { className?: string }) {
	return (
		<Link
			href="/"
			className={clsx(
				"text-[1.75rem] font-extrabold tracking-[-0.03em] text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary drop-shadow-[0_0_12px_rgba(61,174,255,0.2)] transition duration-150 ease-out hover:brightness-110 sm:text-[3rem]",
				className,
			)}
			aria-label="Go to home page"
		>
			Guess the Song
		</Link>
	);
}
