"use client";

import Image from "next/image";

import type { AvatarConfig } from "@/types/avatar";

type AvatarStackProps = {
	avatar?: AvatarConfig;
	size?: 48 | 64 | 80;
	className?: string;
};

const layerSrc = (prefix: string, id?: string) =>
	id && id !== "empty" ? `/avatars/${prefix}/${id}.png` : "";

export default function AvatarStack({ avatar, size = 48, className }: AvatarStackProps) {
	if (!avatar?.base) {
		return <div className={className} />;
	}

	const layerImageClass = "absolute inset-0 object-contain pointer-events-none";
	const px = `${size}px`;

	return (
		<div className={className} style={{ width: px, height: px }}>
			<div className="absolute inset-0 flex items-center justify-center">
				{layerSrc("base", avatar.base) && (
					<Image src={layerSrc("base", avatar.base)} alt="" fill sizes={px} className={layerImageClass} />
				)}
				{layerSrc("eyes", avatar.eyes) && (
					<Image src={layerSrc("eyes", avatar.eyes)} alt="" fill sizes={px} className={layerImageClass} />
				)}
				{layerSrc("hair", avatar.hair) && (
					<Image src={layerSrc("hair", avatar.hair)} alt="" fill sizes={px} className={layerImageClass} />
				)}
				{layerSrc("headwear", avatar.headwear) && (
					<Image
						src={layerSrc("headwear", avatar.headwear)}
						alt=""
						fill
						sizes={px}
						className={layerImageClass}
					/>
				)}
				{layerSrc("mouth", avatar.mouth) && (
					<Image src={layerSrc("mouth", avatar.mouth)} alt="" fill sizes={px} className={layerImageClass} />
				)}
			</div>
		</div>
	);
}
