import React from "react";

export interface OdPropertyRowProps {
  readonly label: string;
  readonly htmlFor?: string | undefined;
  readonly description?: string | undefined;
  readonly action?: React.ReactNode | undefined;
  readonly children: React.ReactNode;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
}

export function OdPropertyRow({
  label,
  htmlFor,
  description,
  action,
  children,
  className = "",
  style,
}: OdPropertyRowProps): React.JSX.Element {
  return (
    <div className={`od-property-row ${className}`.trim()} style={style}>
      <div className="od-property-row__label-cell">
        <label className="od-label" htmlFor={htmlFor} title={description}>
          {label}
        </label>
        {action}
      </div>
      <div className="od-property-row__control-cell">{children}</div>
    </div>
  );
}
