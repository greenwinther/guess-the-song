"use client";
// src/app/page.tsx

import HostCard from "@/components/ui/HostCard";
import JoinCard from "@/components/ui/JoinCard";
import AvatarPicker from "@/components/ui/AvatarPicker";
import { useSocket } from "@/contexts/SocketContext";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { AvatarConfig } from "@/types/avatar";
import { createLobbyFormSchema, firstFieldIssue, joinLobbyFormSchema } from "@/shared/schemas";
import clsx from "clsx";

export default function HomePage() {
	const router = useRouter();
	const socket = useSocket();
	const contentWidthClass = "w-full max-w-[20rem]";

	const [name, setName] = useState<string>("");
	const [roomCode, setRoomCode] = useState<string>("");
	const [joining, setJoining] = useState(false);
	const [creating, setCreating] = useState(false);
	const [view, setView] = useState<"join" | "create">("join");
	const [error, setError] = useState<string | null>(null);
	const [joinNameError, setJoinNameError] = useState<string | null>(null);
	const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
	const [createThemeError, setCreateThemeError] = useState<string | null>(null);
	const [createBgError, setCreateBgError] = useState<string | null>(null);
	const [theme, setTheme] = useState<string>("");
	const [backgroundUrl, setBackgroundUrl] = useState<string>("");

	const getStoredAvatar = (): AvatarConfig | null => {
		try {
			const raw = localStorage.getItem("gts-avatar-v2");
			if (!raw) return null;
			const parsed = JSON.parse(raw) as AvatarConfig;
			return parsed?.base ? parsed : null;
		} catch {
			return null;
		}
	};

	const clearMessages = () => {
		setError(null);
		setJoinNameError(null);
		setJoinCodeError(null);
		setCreateThemeError(null);
		setCreateBgError(null);
	};

	// Create lobby: validate first, then send theme + background URL via socket
	const handleCreate = (e: FormEvent) => {
		e.preventDefault();
		if (creating) return;

		setCreateThemeError(null);
		setCreateBgError(null);
		setError(null);

		const validation = createLobbyFormSchema.safeParse({ theme, backgroundUrl });
		if (!validation.success) {
			setCreateThemeError(firstFieldIssue(validation.error, "theme"));
			setCreateBgError(firstFieldIssue(validation.error, "backgroundUrl"));
			setError("Please fix the highlighted fields.");
			return;
		}

		setCreating(true);
		const avatar = getStoredAvatar();
		socket.emit(
			"createRoom",
			{
				theme: validation.data.theme,
				backgroundUrl: validation.data.backgroundUrl,
				hostName: "Host",
				avatar: avatar ?? undefined,
			},
			(resp) => {
				if (!resp?.code) {
					setError(resp?.error || "Could not create room");
					setCreating(false);
					return;
				}
				try {
					localStorage.setItem(`gts-host-room-${resp.code}`, JSON.stringify({ name: "Host" }));
				} catch {}
				router.push(`/admin/${resp.code}`);
				setCreating(false);
			},
		);
	};

	// Join lobby
	const handleJoin = (e: FormEvent) => {
		e.preventDefault();
		if (joining) return;

		setJoinNameError(null);
		setJoinCodeError(null);
		setError(null);

		const validation = joinLobbyFormSchema.safeParse({ name, roomCode });
		if (!validation.success) {
			setJoinNameError(firstFieldIssue(validation.error, "name"));
			setJoinCodeError(firstFieldIssue(validation.error, "roomCode"));
			setError("Please fix the highlighted fields.");
			return;
		}

		setJoining(true);
		const code = validation.data.roomCode;
		const playerName = validation.data.name;
		const avatar = getStoredAvatar();
		socket.emit("joinRoom", { code, name: playerName, avatar: avatar ?? undefined }, (ok: boolean) => {
			if (ok) {
				router.push(`/play/${code}?name=${encodeURIComponent(playerName)}`);
			} else {
				setError("Failed to join - check the room code and try again.");
				setJoining(false);
			}
		});
	};

	return (
		<main
			className="
			relative isolate min-h-screen overflow-hidden flex flex-col items-center justify-center p-8
			bg-gradient-to-br from-bg to-secondary
			"
		>
			<div className="flex w-full max-w-[26rem] flex-col items-center gap-7">
				<h1
					className="
						relative z-20 w-full text-center
						text-5xl sm:text-5xl font-extrabold tracking-tight
						text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary
						drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]
						leading-normal pb-2
						"
				>
					Guess the Song
				</h1>

				<div className="home-neon-card relative z-10 w-full rounded-[28px] p-[1.75px]">
					<div
						className={clsx(
							"relative w-full overflow-hidden rounded-[26px] px-4 py-5 sm:px-5 sm:py-6",
							"bg-card/20 backdrop-blur-xl shadow-2xl",
							"flex flex-col items-center gap-3",
						)}
					>
						<div className="flex w-full justify-center">
							<div
								className={clsx(
									contentWidthClass,
									"relative z-10 grid grid-cols-2 gap-5 rounded-full p-1",
								)}
							>
								<button
									type="button"
									className={clsx(
										"relative z-10 w-full rounded-full border px-6 py-2 text-base font-semibold transition-colors duration-300",
										"outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
										view === "join"
											? "border-white/15 bg-gradient-to-r from-primary to-secondary text-white shadow-[0_8px_24px_rgba(61,174,255,0.18)]"
											: "border-border/80 bg-card/15 text-text/80 hover:border-border hover:text-text",
									)}
									onClick={() => {
										clearMessages();
										setView("join");
									}}
									aria-pressed={view === "join"}
								>
									Join
								</button>
								<button
									type="button"
									className={clsx(
										"relative z-10 w-full rounded-full border px-6 py-2 text-base font-semibold transition-colors duration-300",
										"outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
										view === "create"
											? "border-white/15 bg-gradient-to-r from-primary to-secondary text-white shadow-[0_8px_24px_rgba(61,174,255,0.18)]"
											: "border-border/80 bg-card/15 text-text/80 hover:border-border hover:text-text",
									)}
									onClick={() => {
										clearMessages();
										setView("create");
									}}
									aria-pressed={view === "create"}
								>
									Host
								</button>
							</div>
						</div>
						{error && (
							<p className="relative z-10 w-full text-center text-sm text-red-400" aria-live="polite">
								{error}
							</p>
						)}
						<div className="relative z-10 flex w-full flex-col items-center gap-3">
							<AvatarPicker compact className={contentWidthClass} />
							{view === "join" ? (
								<JoinCard
									name={name}
									onNameChange={setName}
									code={roomCode}
									onRoomCodeChange={setRoomCode}
									onJoin={handleJoin}
									nameError={joinNameError}
									codeError={joinCodeError}
									disabled={joining}
									isLoading={joining}
									className={contentWidthClass}
									showAvatar={false}
								/>
							) : (
								<HostCard
									theme={theme}
									onThemeChange={setTheme}
									backgroundUrl={backgroundUrl}
									onBackgroundChange={setBackgroundUrl}
									onCreate={handleCreate}
									themeError={createThemeError}
									backgroundUrlError={createBgError}
									disabled={creating}
									isLoading={creating}
									className={contentWidthClass}
									showAvatar={false}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
