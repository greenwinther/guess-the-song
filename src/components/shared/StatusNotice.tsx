import clsx from "clsx";

type StatusNoticeProps = {
	message: string;
	fullScreen?: boolean;
	tone?: "default" | "error";
	className?: string;
};

export default function StatusNotice({
	message,
	fullScreen = false,
	tone = "default",
	className,
}: StatusNoticeProps) {
	const wrapperClassName = fullScreen
		? "grid min-h-screen place-items-center bg-gradient-to-br from-bg via-bg to-secondary p-6"
		: "p-6 text-center text-text";
	const cardClassName = clsx(
		"rounded-2xl border border-border/80 p-6 text-text backdrop-blur-2xl",
		tone === "error" ? "bg-red-500/10" : "bg-card/35",
		className
	);

	return fullScreen ? (
		<main className={wrapperClassName}>
			<div className={cardClassName}>{message}</div>
		</main>
	) : (
		<div className={wrapperClassName}>{message}</div>
	);
}
