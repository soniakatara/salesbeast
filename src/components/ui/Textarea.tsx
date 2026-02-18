import * as React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, className = "", id, ...rest }, ref) {
    const inputId = id ?? (label ? label.replace(/\s/g, "-").toLowerCase() : undefined);
    const base =
      "w-full bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-colors resize-y min-h-[80px]";
    const errorClass = error ? "border-rose-600 focus:ring-rose-500/50 focus:border-rose-500" : "";
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-200">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`${base} ${errorClass} ${className}`.trim()}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={hint ? `${inputId}-hint` : error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {hint && !error && (
          <p id={inputId ? `${inputId}-hint` : undefined} className="text-xs text-neutral-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-rose-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);
