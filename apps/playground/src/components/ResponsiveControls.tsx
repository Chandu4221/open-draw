import React from "react";
import { DEVICE_TYPES, type DeviceType, type PlatformProfile } from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";

export interface ResponsiveControlsProps {
  readonly selectedShape: Shape;
  readonly activeProfile: PlatformProfile | undefined;
  readonly handleToggleHiddenOn: (dt: DeviceType) => void;
  readonly handleOrderChange: (dt: DeviceType, valStr: string) => void;
}

export function ResponsiveControls(props: ResponsiveControlsProps): React.JSX.Element | null {
  const { selectedShape, activeProfile, handleToggleHiddenOn, handleOrderChange } = props;

  if (!activeProfile?.deviceTypes || activeProfile.deviceTypes.length === 0) {
    return null;
  }

  return (
    <>
      <div style={{ marginTop: "16px", marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
          Responsive Visibility (hiddenOn)
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {activeProfile.deviceTypes.map((dt) => {
            const isHidden = selectedShape.meta.hiddenOn?.includes(dt) ?? false;
            return (
              <label
                key={dt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                }}
              >
                <input
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

      <div style={{ marginTop: "16px", marginBottom: "12px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
          Responsive Order (order)
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
          }}
        >
          {activeProfile.deviceTypes.map((dt) => {
            const orderVal = selectedShape.meta.order[dt];
            return (
              <div key={dt} style={{ fontSize: "12px" }}>
                <label style={{ display: "block", color: "#64748b" }}>{DEVICE_TYPES[dt]}:</label>
                <input
                  type="number"
                  placeholder="0"
                  value={orderVal !== undefined ? orderVal : ""}
                  style={{
                    width: "100%",
                    padding: "3px 6px",
                    boxSizing: "border-box",
                  }}
                  onChange={(e) => handleOrderChange(dt, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
