import React from "react";
import { OdBadge } from "./badge";

export interface OdInputGroupProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "prefix"
> {
  readonly prefix?: React.ReactNode | undefined;
  readonly suffix?: React.ReactNode | undefined;
  readonly unit?: string | undefined;
}

export function OdInputGroup({
  prefix,
  suffix,
  unit,
  className = "",
  style,
  ...inputProps
}: OdInputGroupProps): React.JSX.Element {
  const renderedSuffix =
    suffix ??
    (unit ? (
      <OdBadge variant="unit" className="od-input-badge">
        {unit}
      </OdBadge>
    ) : null);

  return (
    <div className={`od-input-group ${className}`.trim()} style={style}>
      {prefix && <span className="od-input-group__prefix">{prefix}</span>}
      <input
        className={`od-input${renderedSuffix ? " od-input--has-suffix" : ""}${prefix ? " od-input--has-prefix" : ""}`}
        {...inputProps}
      />
      {renderedSuffix && <span className="od-input-group__suffix">{renderedSuffix}</span>}
    </div>
  );
}
