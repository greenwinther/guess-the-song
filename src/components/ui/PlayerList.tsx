// src/components/PlayerList.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { AvatarConfig } from "@/types/avatar";
import type { Member } from "@/types/member";

interface PlayerListProps {
	players: Member[];
	submittedPlayers?: string[];
	className?: string;
	fallbackName?: string;
	lockedNames?: string[];
	lockedCounts?: Record<string, number>;
	solvedByTheme?: string[];
	lockedForThisRound?: string[];
	onKick?: (player: Member) => void;
}

export default function PlayerList({
	players,
	submittedPlayers = [],
	className,
	fallbackName,
	lockedNames = [],
	lockedCounts = {},
	solvedByTheme = [],
	lockedForThisRound = [],
	onKick,
}: PlayerListProps) {
	const lockedSet = new Set(lockedNames);
	const [actionForId, setActionForId] = useState<number | null>(null);
	const layerImageClass = "absolute inset-0 object-contain pointer-events-none";
	const hasFallback =
		!!fallbackName && !players.some((p) => p.name.toLowerCase() === fallbackName.toLowerCase());
	const layerSrc = (prefix: string, id?: string) =>
		id && id !== "empty" ? `/avatars/${prefix}/${id}.png` : "";
	const hasAvatar = (avatar?: AvatarConfig) => Boolean(avatar?.base);
	return (
		<div className={`flex flex-col w-full ${className ?? ""}`}>
			<ul className="space-y-2 flex-1">
				{hasFallback && (
					<li key="__fallback__" className="flex items-center gap-2 text-text">
						<span className="w-3 h-3 rounded-full bg-primary" />
						<span>{fallbackName}</span>
						<span className="ml-auto text-xs opacity-70 tabular-nums">0</span>
					</li>
				)}

				{players.map((p) => {
					const didSubmit = submittedPlayers.includes(p.name);
					const isLockedCurrentSong = lockedSet.has(p.name);
					const lockCount = lockedCounts[p.name] ?? 0;
					const avatar = p.avatar;
					const showAvatar = hasAvatar(avatar);

					return (
						<li key={p.id} className="flex items-center gap-2 text-text">
							{/* Dot color = submitted status */}
							{showAvatar ? (
								<div
									className={`relative w-9 h-11 rounded-full border ${
										didSubmit ? "border-green-500" : "border-primary"
									} bg-card/30`}
									title={didSubmit ? "Submitted" : "Not submitted"}
								>
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="relative w-8 h-8">
											{layerSrc("base", avatar?.base) && (
												<Image
													src={layerSrc("base", avatar?.base)}
													alt=""
													fill
													sizes="32px"
													className={layerImageClass}
												/>
											)}
											{layerSrc("eyes", avatar?.eyes) && (
												<Image
													src={layerSrc("eyes", avatar?.eyes)}
													alt=""
													fill
													sizes="32px"
													className={layerImageClass}
												/>
											)}
											{layerSrc("hair", avatar?.hair) && (
												<Image
													src={layerSrc("hair", avatar?.hair)}
													alt=""
													fill
													sizes="32px"
													className={layerImageClass}
												/>
											)}
											{layerSrc("headwear", avatar?.headwear) && (
												<Image
													src={layerSrc("headwear", avatar?.headwear)}
													alt=""
													fill
													sizes="32px"
													className={layerImageClass}
												/>
											)}
											{layerSrc("mouth", avatar?.mouth) && (
												<Image
													src={layerSrc("mouth", avatar?.mouth)}
													alt=""
													fill
													sizes="32px"
													className={layerImageClass}
												/>
											)}
										</div>
									</div>
								</div>
							) : (
								<span
									className={`w-3 h-3 rounded-full ${
										didSubmit ? "bg-green-500" : "bg-primary"
									}`}
									title={didSubmit ? "Submitted" : "Not submitted"}
								/>
							)}
							{onKick && !p.isHost ? (
								<button
									type="button"
									className="truncate text-left hover:underline"
									onClick={() => setActionForId((prev) => (prev === p.id ? null : p.id))}
									title="Player actions"
								>
									{p.name}
								</button>
							) : (
								<span className="truncate">{p.name}</span>
							)}
							{p.ready && (
								<span
									className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10"
									title="Ready"
								>
									READY
								</span>
							)}

							{p.hardcore && (
								<span
									className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10"
									title="Hardcore mode"
								>
									HC
								</span>
							)}

							{/* Song lock */}
							{isLockedCurrentSong && (
								<span className="text-xs opacity-70" title="Locked current song">
									LOCK
								</span>
							)}

							{/* THEME indicators */}
							{solvedByTheme.includes(p.name) && (
								<span title="Solved theme" aria-label="Solved theme" className="ml-1">
									SOLVED
								</span>
							)}

							{!solvedByTheme.includes(p.name) && lockedForThisRound.includes(p.name) && (
								<span
									title="Guessed theme this round"
									aria-label="Guessed theme this round"
									className="ml-1"
								>
									GUESS
								</span>
							)}

							{/* Songs locked count */}
							<span className="ml-auto text-xs opacity-70 tabular-nums" title="Songs locked">
								{lockCount}
							</span>

							{onKick && !p.isHost && actionForId === p.id && (
								<button
									className="ml-2 text-xs uppercase tracking-widest text-red-300/90 hover:text-red-200"
									onClick={() => {
										setActionForId(null);
										onKick(p);
									}}
									title={`Kick ${p.name}`}
								>
									Kick
								</button>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
