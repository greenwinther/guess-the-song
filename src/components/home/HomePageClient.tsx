"use client";
// src/components/home/HomePageClient.tsx

import AvatarRandomizer from "@/components/home/components/AvatarRandomizer";
import HomeEntryCard from "@/components/home/components/HomeEntryCard";
import HomeHero from "@/components/home/components/HomeHero";
import JoinOrHostToggle from "@/components/home/components/JoinOrHostToggle";
import CardInsetLabel from "@/components/home/components/CardInsetLabel";
import styles from "@/components/home/home.module.css";
import AvatarPicker from "@/components/shared/AvatarPicker";
import Input from "@/components/shared/Input";
import { useHomePageState } from "@/hooks/home/useHomePageState";
import clsx from "clsx";

export default function HomePageClient() {
	const contentWidthClass = "w-full max-w-[20rem]";
	const {
		activeEntryLocked,
		avatarPreviewRef,
		cardRef,
		creating,
		error,
		handleCreate,
		handleJoin,
		handleViewChange,
		joinCanSubmit,
		joinCodeError,
		joinLocked,
		joinNameError,
		joining,
		name,
		randomizeSignal,
		roomCode,
		setName,
		setRoomCode,
		triggerRandomize,
		view,
	} = useHomePageState();
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
					<JoinOrHostToggle
						view={view}
						onViewChange={handleViewChange}
						className={contentWidthClass}
					/>
					{error && (
						<p
							className="relative z-10 w-full text-center text-sm text-red-400"
							aria-live="polite"
						>
							{error}
						</p>
					)}
					<HomeEntryCard
						onSubmit={view === "join" ? handleJoin : handleCreate}
						className={clsx("relative z-10", contentWidthClass)}
						topContent={
							view === "join" ? (
								<div className="flex items-stretch gap-2">
									<Input
										type="text"
										variant={joinNameError ? "error" : "default"}
										placeholder="Your Name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
										className="min-w-0 flex-1"
										disabled={joinLocked}
									/>
								</div>
							) : (
								<CardInsetLabel label="Host Ready" />
							)
						}
						topError={
							view === "join" && joinNameError ? (
								<p className="-mt-2 text-xs text-red-400">{joinNameError}</p>
							) : undefined
						}
						middleContent={sharedAvatarSection}
						bottomContent={
							view === "join" ? (
								<Input
									type="text"
									variant={joinCodeError ? "error" : "default"}
									placeholder="Room Code"
									value={roomCode}
									onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
									required
									maxLength={4}
									className="w-full"
									disabled={joinLocked}
								/>
							) : (
								<CardInsetLabel label="Settings in Lobby" />
							)
						}
						bottomError={
							view === "join" && joinCodeError ? (
								<p className="-mt-2 text-xs text-red-400">{joinCodeError}</p>
							) : undefined
						}
						submitLabel={view === "join" ? "Join Lobby" : "Create Lobby"}
						submitButtonClassName={styles.homeSubmitButton}
						disabled={activeEntryLocked}
						isLoading={view === "join" ? joining : creating}
						canSubmit={view === "join" ? joinCanSubmit : true}
					/>
				</div>
			</div>
		</main>
	);
}
