import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import { OdIcon } from "./icons/icon";
import type { IconId } from "./icons/icons";

export interface OdButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "default" | "primary" | "ghost";
  readonly children?: ReactNode;
}

export const OdButton: FC<OdButtonProps> = ({
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const variantClass =
    variant === "primary" ? "od-btn--primary" : variant === "ghost" ? "od-btn--ghost" : "";
  const combinedClass = ["od-btn", variantClass, className].filter(Boolean).join(" ");

  return (
    <button type="button" className={combinedClass} {...props}>
      {children}
    </button>
  );
};

export interface OdIconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label"
> {
  readonly "aria-label": string;
  readonly name?: IconId;
  readonly iconSize?: number;
  readonly active?: boolean;
  readonly ghost?: boolean;
  readonly children?: ReactNode;
}

export const OdIconButton: FC<OdIconButtonProps> = ({
  "aria-label": ariaLabel,
  name,
  iconSize = 16,
  active = false,
  ghost = false,
  className = "",
  children,
  ...props
}) => {
  const activeClass = active ? "od-icon-btn--active" : "";
  const ghostClass = ghost ? "od-icon-btn--ghost" : "";
  const combinedClass = ["od-icon-btn", activeClass, ghostClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" aria-label={ariaLabel} className={combinedClass} {...props}>
      {name ? <OdIcon name={name} size={iconSize} /> : children}
    </button>
  );
};
