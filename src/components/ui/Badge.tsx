import * as React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "accent" | "warning" | "success";
  className?: string;
};

const variantMap = {
  default: "bg-neutral-800 text-neutral-300",
  accent: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  warning: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
  success: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps): JSX.Element {
  const base = "rounded-sm inline-flex items-center text-xs font-medium px-2 py-0.5";
  const variantClass = variantMap[variant];
  return (
    <span className={`${base} ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
