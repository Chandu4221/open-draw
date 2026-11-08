import React, { useState } from "react";
import { OdIcon } from "./icons/icon";

export interface OdCardProps {
  readonly title?: React.ReactNode;
  readonly collapsible?: boolean;
  readonly defaultExpanded?: boolean;
  readonly action?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly headerClassName?: string;
}

export function OdCard({
  title,
  collapsible = false,
  defaultExpanded = true,
  action,
  children,
  className = "",
  headerClassName = "",
}: OdCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

  const toggle = () => {
    if (collapsible) {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <section className={`od-card ${className}`}>
      {title && (
        <header
          className={`od-card__header ${collapsible ? "od-card__header--collapsible" : ""} ${headerClassName}`}
          role={collapsible ? "button" : undefined}
          tabIndex={collapsible ? 0 : undefined}
          aria-expanded={collapsible ? expanded : undefined}
          onClick={collapsible ? toggle : undefined}
          onKeyDown={
            collapsible
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                  }
                }
              : undefined
          }
        >
          <div className="od-card__title-row">
            {collapsible && (
              <span className={`od-card__chevron ${expanded ? "od-card__chevron--expanded" : ""}`}>
                <OdIcon name="chevron" size={14} />
              </span>
            )}
            <h3 className="od-card__title">{title}</h3>
          </div>
          {action && (
            <div className="od-card__action" onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          )}
        </header>
      )}
      {(!collapsible || expanded) && <div className="od-card__body">{children}</div>}
    </section>
  );
}
