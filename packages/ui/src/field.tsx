import type { FC, ReactNode } from "react";

export interface OdFieldProps {
  readonly label: string;
  readonly htmlFor?: string;
  readonly meta?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly horizontal?: boolean;
}

export const OdField: FC<OdFieldProps> = ({
  label,
  htmlFor,
  meta,
  children,
  className = "",
  horizontal = false,
}) => {
  const containerClass = ["od-field", horizontal ? "od-field--horizontal" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <div className="od-field__header">
        <label className="od-label" htmlFor={htmlFor}>
          {label}
        </label>
        {meta ? <span className="od-meta">{meta}</span> : null}
      </div>
      <div className="od-field__control">{children}</div>
    </div>
  );
};
