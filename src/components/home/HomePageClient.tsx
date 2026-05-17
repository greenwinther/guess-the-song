"use client";
// src/components/home/HomePageClient.tsx

import { useRef } from "react";
import AvatarRandomizer from "@/components/home/components/AvatarRandomizer";
import HomeEntryCard from "@/components/home/components/HomeEntryCard";
import HomeHero from "@/components/home/components/HomeHero";
import styles from "@/components/home/home.module.css";
import AvatarPicker from "@/components/home/components/AvatarPicker";
import Input from "@/components/shared/Input";
import { useHomePageState } from "@/hooks/home/useHomePageState";
import clsx from "clsx";

export default function HomePageClient() {
	const contentWidthClass = "w-full max-w-[20rem]";
	const {
		activeEntryLocked,
		avatarPreviewRef,
		canSubmit,
		cardRef,
		creating,
		error,
		handleSubmit,
		joining,
		isJoiningFlow,
		isRoomCodeReadyToJoin,
		name,
		nameError,
		randomizeSignal,
		roomCode,
		roomCodeError,
		setName,
		setRoomCode,
		triggerRandomize,
	} = useHomePageState();
	const formRef = useRef<HTMLFormElement | null>(null);
	const roomCodeInputRef = useRef<HTMLInputElement | null>(null);
	const sharedAvatarSection = (
		<>
			<AvatarRandomizer onRandomize={triggerRandomize} disabled={activeEntryLocked} />
			<AvatarPicker
				compact
				showRandomizeButton={false}
				randomizeSignal={randomizeSignal}
				previewRef={avatarPreviewRef}
				previewClassName={styles.avatarPreviewTilt}
			/>
		</>
	);

	return (
		<main
			className="
			relative isolate min-h-screen overflow-hidden flex flex-col items-center justify-center p-8
			bg-gradient-to-br from-bg to-secondary
			"
		>
			<div
				ref={cardRef}
				className={clsx(
					styles.homeNeonCard,
					"relative z-10 flex w-fit max-w-full flex-col items-center rounded-[28px] p-[1.75px]",
				)}
			>
				<div
					className={clsx(
						styles.homeCardSurface,
						"relative w-full overflow-hidden rounded-[26px] px-4 py-5 sm:px-5 sm:py-6",
						"bg-card/20 backdrop-blur-xl shadow-2xl",
						"flex flex-col items-center gap-3",
					)}
				>
					<HomeHero />
					{error && (
						<p
							className="relative z-10 w-full text-center text-sm text-red-400"
							aria-live="polite"
						>
							{error}
						</p>
					)}
					<HomeEntryCard
						formRef={formRef}
						onSubmit={handleSubmit}
						className={clsx("relative z-10", contentWidthClass)}
						topContent={
							<div className="flex items-stretch gap-2">
								<Input
									type="text"
									variant={nameError ? "error" : "default"}
									placeholder="Your Name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									onKeyDown={(event) => {
										if (event.key !== "Enter") return;
										if (!roomCode.trim()) {
											event.preventDefault();
											roomCodeInputRef.current?.focus();
											return;
										}
										if (!isRoomCodeReadyToJoin) {
											event.preventDefault();
											roomCodeInputRef.current?.focus();
											return;
										}
										event.preventDefault();
										formRef.current?.requestSubmit();
									}}
									required
									className="min-w-0 flex-1"
									disabled={activeEntryLocked}
								/>
							</div>
						}
						topError={
							nameError ? <p className="-mt-2 text-xs text-red-400">{nameError}</p> : undefined
						}
						middleContent={sharedAvatarSection}
						bottomContent={
							<div className="flex flex-col gap-1">
								<Input
									type="text"
									variant={roomCodeError ? "error" : "default"}
									placeholder="Room Code (Optional)"
									ref={roomCodeInputRef}
									value={roomCode}
									onChange={(e) => setRoomCode(e.target.value)}
									maxLength={12}
									className="w-full"
									disabled={activeEntryLocked}
								/>
								<p className="text-xs text-text/70">
									Enter a code to join, or leave empty to create.
								</p>
							</div>
						}
						bottomError={
							roomCodeError ? (
								<p className="-mt-2 text-xs text-red-400">{roomCodeError}</p>
							) : undefined
						}
						submitLabel={isJoiningFlow ? "Join Room" : "Create Room"}
						submitButtonClassName={styles.homeSubmitButton}
						disabled={activeEntryLocked}
						isLoading={isJoiningFlow ? joining : creating}
						canSubmit={canSubmit}
					/>
				</div>
			</div>
		</main>
	);
}
