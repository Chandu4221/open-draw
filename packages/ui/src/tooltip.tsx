import type { FC, ReactNode } from "react";

export interface OdTooltipProps {
  readonly text: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export const OdTooltip: FC<OdTooltipProps> = ({ text, children, className = "" }) => {
  if (!text) {
    return <>{children}</>;
  }

  const combinedClass = ["od-tooltip-host", className].filter(Boolean).join(" ");

  return (
    <span className={combinedClass} data-tooltip={text}>
      {children}
    </span>
  );
};
