import type { FC, SVGProps } from "react";
import { ICONS, type IconId } from "./icons";

export interface OdIconProps extends SVGProps<SVGSVGElement> {
  readonly name: IconId;
  readonly size?: number;
}

export const OdIcon: FC<OdIconProps> = ({ name, size = 16, className, ...props }) => {
  const path = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d={path} />
    </svg>
  );
};
