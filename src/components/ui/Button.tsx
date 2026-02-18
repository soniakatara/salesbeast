import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
};

const variantMap = {
  primary:
    "bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "hover:bg-neutral-800 text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "text-rose-400 hover:bg-rose-950/30 border border-rose-800 disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizeMap = {
  sm: "py-1.5 px-2 text-xs",
  md: "py-2 px-3 text-sm",
  lg: "py-2.5 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps): JSX.Element {
  const base =
    "rounded-sm font-medium inline-flex items-center justify-center transition-colors";
  const variantClass = variantMap[variant];
  const sizeClass = sizeMap[size];
  const widthClass = fullWidth ? "w-full" : "";
  const { type = "button", ...buttonRest } = rest;
  return (
    <button
      type={type}
      className={`${base} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      disabled={disabled ?? isLoading}
      {...buttonRest}
    >
      {isLoading ? "…" : children}
    </button>
  );
}
