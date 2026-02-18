import * as React from "react";

type SectionProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Section({
  title,
  description,
  children,
  className = "",
}: SectionProps): JSX.Element {
  return (
    <section className={`space-y-4 ${className}`.trim()}>
      {(title ?? description) && (
        <div>
          {title && (
            <h2 className="text-base font-medium text-neutral-200">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
