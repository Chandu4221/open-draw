import type { ReactElement } from "react";
import { OdIcon } from "./icons/icon";
import type { IconId } from "./icons/icons";

export interface OdSegmentedItem<T extends string = string> {
  readonly id: T;
  readonly label?: string;
  readonly icon?: IconId;
  readonly tooltip?: string;
  readonly "aria-label"?: string;
}

export interface OdSegmentedControlProps<T extends string = string> {
  readonly items: readonly OdSegmentedItem<T>[];
  readonly value?: T;
  readonly onSelect: (id: T) => void;
  readonly className?: string;
  readonly "aria-label"?: string;
}

export function OdSegmentedControl<T extends string = string>({
  items,
  value,
  onSelect,
  className = "",
  "aria-label": ariaLabel,
}: OdSegmentedControlProps<T>): ReactElement {
  const containerClass = ["od-segmented", className].filter(Boolean).join(" ");

  return (
    <div className={containerClass} role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.id === value;
        const itemClass = ["od-segmented__item", isActive ? "od-segmented__item--active" : ""]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={item.id}
            type="button"
            className={itemClass}
            aria-pressed={isActive}
            aria-label={item["aria-label"] ?? item.label ?? item.id}
            title={item.tooltip}
            onClick={() => onSelect(item.id)}
          >
            {item.icon ? <OdIcon name={item.icon} size={14} /> : null}
            {item.label ? <span>{item.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
