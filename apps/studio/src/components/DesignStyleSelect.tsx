import React from "react";
import { DESIGN_STYLES, DESIGN_STYLE_LABELS, type DesignStyleId } from "@open-draw/contracts";
import { OdField } from "@open-draw/ui";

export interface DesignStyleSelectProps {
  readonly rootDesignStyle: DesignStyleId | undefined;
  readonly handleSetDesignStyle: (designStyle: DesignStyleId | "") => void;
}

export function DesignStyleSelect(props: DesignStyleSelectProps): React.JSX.Element {
  const { rootDesignStyle, handleSetDesignStyle } = props;

  return (
    <OdField label="Design Style" htmlFor="container-design-style">
      <select
        id="container-design-style"
        className="od-select"
        style={{ width: "100%" }}
        value={rootDesignStyle ?? ""}
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
    </OdField>
  );
}
