import React from "react";
import { DEVICE_TYPES, type DeviceType, type PlatformProfile } from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";

export interface ResponsiveControlsProps {
  readonly selectedShape: Shape;
  readonly activeProfile: PlatformProfile | undefined;
  readonly handleToggleHiddenOn: (dt: DeviceType) => void;
  readonly handleOrderChange: (dt: DeviceType, valStr: string) => void;
}

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
      <div>
        <span className="od-label" style={{ display: "block", marginBottom: "var(--od-4)" }}>
          Visibility (Hidden On)
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--od-8)" }}>
          {activeProfile.deviceTypes.map((dt) => {
            const isHidden = selectedShape.meta.hiddenOn?.includes(dt) ?? false;
            const inputId = `responsive-hidden-${selectedShape.id}-${dt}`;
            return (
              <label
                key={dt}
                htmlFor={inputId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--od-4)",
                  fontSize: "var(--od-text-xs)",
                  color: "var(--od-text-secondary)",
                  cursor: "pointer",
                }}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={isHidden}
                  onChange={() => handleToggleHiddenOn(dt)}
                />
                <span>{DEVICE_TYPES[dt]}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <span className="od-label" style={{ display: "block", marginBottom: "var(--od-4)" }}>
          Flex Order
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
                  aria-label={`Flex order for ${DEVICE_TYPES[dt]}`}
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
