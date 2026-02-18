import * as React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "article" | "section";
};

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  className = "",
  padding = "md",
  as: As = "div",
}: CardProps): JSX.Element {
  const paddingClass = paddingMap[padding];
  return (
    <As
      className={`bg-neutral-900 border border-neutral-800 rounded-md ${paddingClass} ${className}`.trim()}
    >
      {children}
    </As>
  );
}
