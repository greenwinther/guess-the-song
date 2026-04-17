// src/hooks/useAvatarPreviewTilt.ts

import { RefObject, useEffect, useRef } from "react";

export default function useAvatarPreviewTilt({
	cardRef,
	avatarPreviewRef,
}: {
	cardRef: RefObject<HTMLDivElement | null>;
	avatarPreviewRef: RefObject<HTMLDivElement | null>;
}) {
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		const resetAvatarTilt = () => {
			const preview = avatarPreviewRef.current;
			if (!preview) return;
			preview.style.setProperty("--avatar-rotate-x", "0deg");
			preview.style.setProperty("--avatar-rotate-y", "0deg");
		};

		const updateAvatarTilt = (clientX: number, clientY: number) => {
			const preview = avatarPreviewRef.current;
			if (!preview) return;

			const cardRect = cardRef.current?.getBoundingClientRect();
			if (
				cardRect &&
				clientX >= cardRect.left &&
				clientX <= cardRect.right &&
				clientY >= cardRect.top &&
				clientY <= cardRect.bottom
			) {
				resetAvatarTilt();
				return;
			}

			const viewportWidth = window.innerWidth || 1;
			const viewportHeight = window.innerHeight || 1;
			const normalizedX = (clientX / viewportWidth - 0.5) * 2;
			const normalizedY = (clientY / viewportHeight - 0.5) * 2;
			const rotateY = normalizedX * 11;
			const rotateX = normalizedY * -11;

			preview.style.setProperty("--avatar-rotate-x", `${rotateX.toFixed(2)}deg`);
			preview.style.setProperty("--avatar-rotate-y", `${rotateY.toFixed(2)}deg`);
		};

		const handleMouseMove = (event: MouseEvent) => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			animationFrameRef.current = window.requestAnimationFrame(() => {
				updateAvatarTilt(event.clientX, event.clientY);
				animationFrameRef.current = null;
			});
		};

		const handlePointerExit = () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			resetAvatarTilt();
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("blur", handlePointerExit);
		document.addEventListener("mouseleave", handlePointerExit);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("blur", handlePointerExit);
			document.removeEventListener("mouseleave", handlePointerExit);
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [avatarPreviewRef, cardRef]);
}
