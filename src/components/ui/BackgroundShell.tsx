// src/components/ui/BackgroundShell.tsx
import { ReactNode } from "react";

type Props = {
	bgImage?: string | null;
	socketError?: string | null;
	variant?: "default" | "glass" | "workspace";
	as?: "div" | "main";
	contentClassName?: string;
	children: ReactNode;
};

export default function BackgroundShell({
	bgImage,
	socketError,
	variant = "default",
	as = "div",
	contentClassName = "",
	children,
}: Props) {
	const RootTag = as;
	const backgroundStyle = bgImage
		? {
				backgroundImage: `linear-gradient(135deg, rgb(var(--color-bg-rgb) / 0.9), rgb(var(--color-secondary-rgb) / 0.4)), url(${bgImage})`,
			}
		: undefined;
	const canvasClassName =
		"relative isolate flex min-h-screen justify-center overflow-hidden bg-gradient-to-br from-bg to-secondary bg-no-repeat bg-cover bg-center px-4 py-4 pt-0 sm:px-6 sm:py-6 sm:pt-0 lg:px-6 lg:py-8 lg:pt-0";
	const shellClassName =
		variant === "glass"
			? "mx-auto w-full max-w-[90rem] rounded-[28px] border border-border/80 bg-card/24 backdrop-blur-2xl shadow-[0_28px_70px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden"
			: variant === "workspace"
				? "mx-auto flex w-full max-w-[90rem] flex-col"
				: "w-full max-w-none bg-card/60 border border-border rounded-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden";

	return (
		<RootTag className={canvasClassName} style={backgroundStyle}>
			{socketError && (
				<div className="fixed top-0 left-0 w-full bg-yellow-300 text-yellow-900 text-center py-2 z-50">
					{socketError}
				</div>
			)}

			<div className={`${shellClassName} ${contentClassName}`.trim()}>{children}</div>
		</RootTag>
	);
}
