"use client";

import clsx from "clsx";

import AvatarStack from "@/components/ui/AvatarStack";

import type { Member } from "@/types/member";

type ShowroomSceneProps = {
	players: Member[];
	currentUserName?: string;
	heading: string;
	subheading: string;
	badges?: string[];
};

export default function ShowroomScene({
	players,
	currentUserName,
	heading,
	subheading,
	badges = [],
}: ShowroomSceneProps) {
	const hostPlayer = players.find((player) => player.isHost);
	const guestPlayers = players.filter((player) => !player.isHost);
	const featuredPlayers = hostPlayer ? [hostPlayer, ...guestPlayers] : players;

	return (
		<section className="relative overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_42%),linear-gradient(180deg,rgba(36,14,26,0.95)_0%,rgba(17,11,18,0.98)_100%)] p-5 shadow-2xl">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-red-950/90 via-red-900/55 to-transparent" />
				<div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-red-950/90 via-red-900/55 to-transparent" />
				<div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-200/10 blur-3xl" />
				<div className="absolute inset-x-10 top-16 h-px bg-gradient-to-r from-transparent via-amber-100/30 to-transparent" />
				<div className="absolute left-1/2 top-20 h-28 w-[72%] -translate-x-1/2 rounded-t-[999px] border border-white/10 bg-gradient-to-b from-white/8 to-transparent" />
				<div className="absolute bottom-10 left-1/2 h-20 w-[84%] -translate-x-1/2 rounded-[999px] bg-gradient-to-r from-transparent via-amber-400/10 to-transparent blur-xl" />
				<div className="absolute bottom-6 left-1/2 h-6 w-[88%] -translate-x-1/2 rounded-full bg-black/35 blur-md" />
			</div>

			<div className="relative">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<div className="text-[10px] uppercase tracking-[0.28em] text-amber-100/55">
							Showroom
						</div>
						<h3 className="mt-2 text-xl font-semibold text-amber-50">{heading}</h3>
						<p className="mt-1 text-sm text-amber-50/70">{subheading}</p>
					</div>
					{badges.length > 0 && (
						<div className="flex flex-wrap justify-end gap-2">
							{badges.map((badge) => (
								<span
									key={badge}
									className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-50/65"
								>
									{badge}
								</span>
							))}
						</div>
					)}
				</div>

				<div className="mt-6 rounded-[24px] border border-white/10 bg-black/18 px-4 py-5 backdrop-blur-sm">
					<div className="mx-auto max-w-xl rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(123,28,28,0.18)_0%,rgba(54,25,43,0.12)_55%,rgba(16,10,16,0.1)_100%)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
						<div className="mx-auto w-fit rounded-full border border-amber-100/15 bg-amber-100/10 px-4 py-1 text-[10px] uppercase tracking-[0.28em] text-amber-100/65">
							Curtains Closed
						</div>
						<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{featuredPlayers.map((player, index) => {
								const isCurrent = currentUserName
									? player.name.toLowerCase() === currentUserName.toLowerCase()
									: false;

								return (
									<div
										key={player.id ?? `${player.name}-${index}`}
										className={clsx(
											"relative overflow-hidden rounded-2xl border px-3 pb-3 pt-4 text-center",
											"bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_100%)] shadow-lg",
											isCurrent
												? "border-primary/55 bg-primary/10"
												: "border-white/10"
										)}
									>
										<div className="pointer-events-none absolute inset-x-5 top-0 h-10 rounded-b-full bg-amber-200/10 blur-xl" />
										<div className="relative mx-auto h-20 w-20 rounded-full border border-white/10 bg-card/35">
											{player.avatar?.base ? (
												<AvatarStack avatar={player.avatar} size={80} className="relative h-20 w-20" />
											) : (
												<div className="grid h-full w-full place-items-center text-2xl text-white/55">
													{player.name.charAt(0).toUpperCase()}
												</div>
											)}
										</div>
										<div className="mt-3 text-sm font-semibold text-amber-50">{player.name}</div>
										<div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-amber-50/55">
											{player.isHost ? "Host Booth" : isCurrent ? "Your Table" : "Guest Table"}
										</div>
										<div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] uppercase tracking-[0.18em]">
											{player.ready && (
												<span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-emerald-100">
													Ready
												</span>
											)}
											{player.hardcore && (
												<span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-amber-100">
													Hardcore
												</span>
											)}
											{!player.ready && !player.isHost && (
												<span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-amber-50/55">
													Settling In
												</span>
											)}
										</div>
										<div className="mt-3 h-2 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,220,140,0.22)_50%,rgba(255,255,255,0.06)_100%)]" />
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
