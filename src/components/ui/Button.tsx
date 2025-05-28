"use client";
// src/components/ui/Button.tsx

import { FC, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

// Define explicit size and variant types
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonVariant = "primary" | "secondary" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	/** Button size */
	size?: ButtonSize;
	/** Button style variant */
	variant?: ButtonVariant;
};

const baseStyles = "rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition";

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
	sm: "px-3 py-1 text-sm",
	md: "px-4 py-2 text-base",
	lg: "px-6 py-3 text-lg",
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
	primary: "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 focus:ring-secondary",
	secondary: "bg-card bg-opacity-20 border border-border text-text hover:bg-opacity-30 focus:ring-primary",
	danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

export const Button: FC<ButtonProps> = ({
	variant = "primary",
	size = "md",
	className,
	children,
	...props
}) => {
	return (
		<button className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
			{children}
		</button>
	);
};

export default Button;
