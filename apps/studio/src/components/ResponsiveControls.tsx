import React from "react";
import { DEVICE_TYPES, type DeviceType, type PlatformProfile } from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { OdIconButton, type IconId } from "@open-draw/ui";

export interface ResponsiveControlsProps {
  readonly selectedShape: Shape;
  readonly activeProfile: PlatformProfile | undefined;
  readonly handleToggleHiddenOn: (dt: DeviceType) => void;
  readonly handleOrderChange: (dt: DeviceType, valStr: string) => void;
}

const DEVICE_ICON_MAP: Readonly<Record<DeviceType, IconId>> = {
  mobile: "smartphone",
  tablet: "tablet",
  laptop: "laptop",
  desktop: "desktop",
  largeScreen: "monitor",
};

export function ResponsiveControls(props: ResponsiveControlsProps): React.JSX.Element {
  const { selectedShape, activeProfile, handleToggleHiddenOn, handleOrderChange } = props;

  if (!activeProfile?.deviceTypes || activeProfile.deviceTypes.length === 0) {
    return (
      <span className="od-meta" style={{ fontStyle: "italic" }}>
        Responsive device controls apply to Web platform profiles.
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-12)" }}>
      {/* Device Visibility */}
      <div>
        <span className="od-label" style={{ display: "block", marginBottom: "var(--od-6)" }}>
          Device Visibility
        </span>
        <div style={{ display: "flex", gap: "var(--od-4)", flexWrap: "wrap" }}>
          {activeProfile.deviceTypes.map((dt) => {
            const isHidden = selectedShape.meta.hiddenOn?.includes(dt) ?? false;
            const icon = DEVICE_ICON_MAP[dt];
            const deviceLabel = DEVICE_TYPES[dt];
            return (
              <OdIconButton
                key={dt}
                name={icon}
                aria-label={
                  isHidden
                    ? `Hidden on ${deviceLabel} (click to show)`
                    : `Visible on ${deviceLabel} (click to hide)`
                }
                title={
                  isHidden
                    ? `Hidden on ${deviceLabel} (click to show)`
                    : `Visible on ${deviceLabel} (click to hide)`
                }
                onClick={() => handleToggleHiddenOn(dt)}
                active={!isHidden}
                ghost={isHidden}
                style={{
                  opacity: isHidden ? 0.35 : 1,
                  border: isHidden
                    ? "1px dashed var(--od-border-strong)"
                    : "1px solid var(--od-accent)",
                  backgroundColor: isHidden ? "transparent" : "var(--od-accent-soft)",
                  color: isHidden ? "var(--od-text-tertiary)" : "var(--od-accent)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Display Order */}
      <div>
        <span className="od-label" style={{ display: "block", marginBottom: "var(--od-6)" }}>
          Display Order
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--od-8)",
          }}
        >
          {activeProfile.deviceTypes.map((dt) => {
            const orderVal = selectedShape.meta.order[dt];
            const inputId = `responsive-order-${selectedShape.id}-${dt}`;
            return (
              <div
                key={dt}
                style={{ display: "flex", flexDirection: "column", gap: "var(--od-2)" }}
              >
                <label htmlFor={inputId} className="od-meta">
                  {DEVICE_TYPES[dt]}
                </label>
                <input
                  id={inputId}
                  type="number"
                  className="od-input"
                  placeholder="0"
                  aria-label={`Display order for ${DEVICE_TYPES[dt]}`}
                  value={orderVal !== undefined ? orderVal : ""}
                  onChange={(e) => handleOrderChange(dt, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
