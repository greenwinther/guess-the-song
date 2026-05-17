"use client";
// src/components/ui/Input.tsx

import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

// Define explicit size and variant types
type InputSize = "sm" | "md" | "lg";
type InputVariant = "default" | "error";

// Omit native HTML `size` attribute to avoid conflict with our `size` prop
type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
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

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ size = "md", variant = "default", className, ...props }, ref) => (
		<input
			ref={ref}
			className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
			{...props}
		/>
	)
);

Input.displayName = "Input";

export default Input;
