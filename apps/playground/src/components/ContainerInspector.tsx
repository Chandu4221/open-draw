import {
  DESIGN_STYLE_LABELS,
  DESIGN_STYLES,
  PLATFORM_BY_VALUE,
  PLATFORMS,
  STYLE_PROFILES,
  type DesignStyleId,
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
  readonly rootDesignStyle?: DesignStyleId | undefined;
  readonly activeProfile: PlatformProfile | undefined;
  readonly handleSetLabel: (labelStr: string) => void;
  readonly handleSetPlatform: (platform: PlatformId | "") => void;
  readonly handleSetStyle: (style: StyleId) => void;
  readonly handleSetDesignStyle?: ((designStyle: DesignStyleId | "") => void) | undefined;
}

export function ContainerInspector(props: ContainerInspectorProps): React.JSX.Element {
  const {
    selectedShape,
    rootPlatform,
    rootStyle,
    rootDesignStyle,
    activeProfile,
    handleSetLabel,
    handleSetPlatform,
    handleSetStyle,
    handleSetDesignStyle,
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
          value={rootPlatform ? (PLATFORMS[rootPlatform] ?? rootPlatform) : ""}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
          }}
          onChange={(e) => {
            const val = e.target.value;
            const platform = val ? (PLATFORM_BY_VALUE[val] ?? (val as PlatformId)) : "";
            handleSetPlatform(platform);
          }}
        >
          <option value="">(None / Platform-Agnostic)</option>
          <option value={PLATFORMS.web}>Web</option>
          <option value={PLATFORMS.androidNative}>Android Native (Material 3)</option>
          <option value={PLATFORMS.flutter}>Flutter</option>
          <option value={PLATFORMS.ios}>iOS (Apple HIG)</option>
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
          Render Style (R-021)
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

      {rootPlatform !== undefined && handleSetDesignStyle && (
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
            Design Style (AI Prompt / Mockup)
          </label>
          <select
            value={rootDesignStyle ?? ""}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
            onChange={(e) => handleSetDesignStyle(e.target.value as DesignStyleId | "")}
          >
            <option value="">(None / Default)</option>
            <optgroup label="Modern & Contemporary">
              <option value={DESIGN_STYLES.minimalism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.minimalism]}
              </option>
              <option value={DESIGN_STYLES.modernMinimalism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.modernMinimalism]}
              </option>
              <option value={DESIGN_STYLES.flatDesign}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.flatDesign]}
              </option>
              <option value={DESIGN_STYLES.cleanCorporate}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.cleanCorporate]}
              </option>
              <option value={DESIGN_STYLES.editorial}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.editorial]}
              </option>
              <option value={DESIGN_STYLES.swissStyle}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.swissStyle]}
              </option>
            </optgroup>
            <optgroup label="Depth & Surface">
              <option value={DESIGN_STYLES.glassmorphism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.glassmorphism]}
              </option>
              <option value={DESIGN_STYLES.neumorphism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.neumorphism]}
              </option>
              <option value={DESIGN_STYLES.claymorphism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.claymorphism]}
              </option>
              <option value={DESIGN_STYLES.frostedGlass}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.frostedGlass]}
              </option>
              <option value={DESIGN_STYLES.softShadows}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.softShadows]}
              </option>
            </optgroup>
            <optgroup label="Bold & Experimental">
              <option value={DESIGN_STYLES.brutalism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.brutalism]}
              </option>
              <option value={DESIGN_STYLES.neoBrutalism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.neoBrutalism]}
              </option>
              <option value={DESIGN_STYLES.antiDesign}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.antiDesign]}
              </option>
              <option value={DESIGN_STYLES.maximalism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.maximalism]}
              </option>
              <option value={DESIGN_STYLES.deconstructivism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.deconstructivism]}
              </option>
            </optgroup>
            <optgroup label="Retro & Nostalgic">
              <option value={DESIGN_STYLES.retro90s}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.retro90s]}
              </option>
              <option value={DESIGN_STYLES.y2k}>{DESIGN_STYLE_LABELS[DESIGN_STYLES.y2k]}</option>
              <option value={DESIGN_STYLES.cyberpunk}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.cyberpunk]}
              </option>
              <option value={DESIGN_STYLES.synthwave}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.synthwave]}
              </option>
              <option value={DESIGN_STYLES.pixelArt}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.pixelArt]}
              </option>
            </optgroup>
            <optgroup label="Layout & Content">
              <option value={DESIGN_STYLES.bentoGrid}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.bentoGrid]}
              </option>
              <option value={DESIGN_STYLES.cardBased}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.cardBased]}
              </option>
              <option value={DESIGN_STYLES.dashboardFirst}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.dashboardFirst]}
              </option>
              <option value={DESIGN_STYLES.modularGrid}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.modularGrid]}
              </option>
            </optgroup>
            <optgroup label="Luxury & Premium">
              <option value={DESIGN_STYLES.luxuryMinimalism}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.luxuryMinimalism]}
              </option>
              <option value={DESIGN_STYLES.darkLuxury}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.darkLuxury]}
              </option>
              <option value={DESIGN_STYLES.artDeco}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.artDeco]}
              </option>
            </optgroup>
            <optgroup label="Technical & Specialized">
              <option value={DESIGN_STYLES.terminalMonospace}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.terminalMonospace]}
              </option>
              <option value={DESIGN_STYLES.blueprint}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.blueprint]}
              </option>
              <option value={DESIGN_STYLES.monochrome}>
                {DESIGN_STYLE_LABELS[DESIGN_STYLES.monochrome]}
              </option>
            </optgroup>
          </select>
        </div>
      )}
    </div>
  );
}
