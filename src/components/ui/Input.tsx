"use client";
// src/components/ui/Input.tsx

import { FC, InputHTMLAttributes } from "react";
import clsx from "clsx";

// Define explicit size and variant types
export type InputSize = "sm" | "md" | "lg";
export type InputVariant = "default" | "error";

// Omit native HTML `size` attribute to avoid conflict with our `size` prop
export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
	/** Input size */
	size?: InputSize;
	/** Variant style */
	variant?: InputVariant;
};

const baseStyles =
	"bg-transparent border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition";

// Explicitly map size keys
const sizeStyles: Record<InputSize, string> = {
	sm: "px-2 py-1 text-sm",
	md: "px-3 py-2 text-base",
	lg: "px-4 py-3 text-lg",
};

// Explicitly map variant keys
const variantStyles: Record<InputVariant, string> = {
	default: "border border-border focus:border-primary focus:ring-primary",
	error: "border border-red-500 focus:border-red-600 focus:ring-red-600",
};

export const Input: FC<InputProps> = ({ size = "md", variant = "default", className, ...props }) => {
	return (
		<input className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props} />
	);
};

export default Input;
