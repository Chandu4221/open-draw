import React from "react";

export type OdBadgeVariant = "default" | "unit" | "accent" | "outline";

export interface OdBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly variant?: OdBadgeVariant;
  readonly children: React.ReactNode;
}

export function OdBadge({
  variant = "default",
  className = "",
  children,
  ...rest
}: OdBadgeProps): React.JSX.Element {
  const variantClass = variant !== "default" ? ` od-badge--${variant}` : "";

  return (
    <span className={`od-badge${variantClass} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}
