import React from "react";
import {
  STYLE_PROFILES,
  type PlatformId,
  type PlatformProfile,
  type StyleId,
} from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { resolveShapeDisplayName } from "@open-draw/semantics";

export interface ContainerInspectorProps {
  readonly selectedShape: Shape;
  readonly rootPlatform: PlatformId | undefined;
  readonly rootStyle: StyleId;
  readonly activeProfile: PlatformProfile | undefined;
  readonly handleSetLabel: (labelStr: string) => void;
  readonly handleSetPlatform: (platform: PlatformId | "") => void;
  readonly handleSetStyle: (style: StyleId) => void;
}

export function ContainerInspector(props: ContainerInspectorProps): React.JSX.Element {
  const {
    selectedShape,
    rootPlatform,
    rootStyle,
    activeProfile,
    handleSetLabel,
    handleSetPlatform,
    handleSetStyle,
  } = props;

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
          Name (R-042)
        </label>
        <input
          type="text"
          placeholder={resolveShapeDisplayName(selectedShape, activeProfile)}
          value={selectedShape.label ?? ""}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            boxSizing: "border-box",
          }}
          onChange={(e) => handleSetLabel(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "12px", color: "#64748b" }}>
        <strong>Shape ID:</strong> {selectedShape.id}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
          Platform Profile (R-026)
        </label>
        <select
          value={rootPlatform ?? ""}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
          }}
          onChange={(e) => handleSetPlatform(e.target.value as PlatformId | "")}
        >
          <option value="">(None / Platform-Agnostic)</option>
          <option value="web">Web</option>
          <option value="androidNative">Android Native (Material 3)</option>
          <option value="flutter">Flutter</option>
          <option value="ios">iOS (Stub)</option>
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
          Design Style (R-026)
        </label>
        <select
          value={rootStyle}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
          }}
          onChange={(e) => handleSetStyle(e.target.value as StyleId)}
        >
          <option value={STYLE_PROFILES.minimal}>Minimal Wireframe</option>
          <option value={STYLE_PROFILES.crayon}>Crayon / Hand-drawn</option>
        </select>
      </div>
    </div>
  );
}
