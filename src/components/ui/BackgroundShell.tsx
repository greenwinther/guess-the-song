// src/components/join/BackgroundShell.tsx
import { ReactNode } from "react";

type Props = {
	bgImage?: string | null;
	socketError?: string | null;
	children: ReactNode;
};

export default function BackgroundShell({ bgImage, socketError, children }: Props) {
	return (
		<div
			className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-bg to-secondary bg-no-repeat bg-cover bg-center"
			style={{
				backgroundImage: bgImage ? `url(${bgImage})` : "none",
				backgroundBlendMode: "overlay",
			}}
		>
			{socketError && (
				<div className="fixed top-0 left-0 w-full bg-yellow-300 text-yellow-900 text-center py-2 z-50">
					{socketError}
				</div>
			)}

			<div className="w-full max-w-none bg-card/60 border border-border rounded-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
				{children}
			</div>
		</div>
	);
}
