import React from "react";
import {
  THEME_PALETTE_SLOTS,
  type ThemePalette,
  type ThemePaletteSlot,
} from "@open-draw/contracts";
import { OdField } from "@open-draw/ui";

export interface ThemePaletteSectionProps {
  readonly theme: ThemePalette | undefined;
  readonly onThemeChange: (theme: ThemePalette | undefined) => void;
}

const PALETTE_PRESETS: Readonly<Record<string, ThemePalette>> = {
  "Minimal Blue": {
    primary: "#2563eb",
    secondary: "#64748b",
    tertiary: "#0ea5e9",
    surface: "#ffffff",
    error: "#ef4444",
    success: "#22c55e",
  },
  "Modern Emerald": {
    primary: "#059669",
    secondary: "#64748b",
    tertiary: "#10b981",
    surface: "#ffffff",
    error: "#ef4444",
    success: "#10b981",
  },
  "Vibrant Sunset": {
    primary: "#ea580c",
    secondary: "#d97706",
    tertiary: "#f59e0b",
    surface: "#ffffff",
    error: "#dc2626",
    success: "#16a34a",
  },
  "Deep Midnight": {
    primary: "#6366f1",
    secondary: "#475569",
    tertiary: "#8b5cf6",
    surface: "#0f172a",
    error: "#f43f5e",
    success: "#10b981",
  },
};

export function ThemePaletteSection({
  theme,
  onThemeChange,
}: ThemePaletteSectionProps): React.JSX.Element {
  const currentTheme: ThemePalette = theme ?? {};

  const handleSlotChange = (slot: ThemePaletteSlot, value: string): void => {
    const next: Record<string, string> = { ...currentTheme };
    if (value.trim() === "") {
      delete next[slot];
    } else {
      next[slot] = value;
    }
    const hasValues = Object.keys(next).length > 0;
    onThemeChange(hasValues ? next : undefined);
  };

  const handlePresetSelect = (presetName: string): void => {
    if (presetName === "") {
      onThemeChange(undefined);
      return;
    }
    const preset = PALETTE_PRESETS[presetName];
    if (preset !== undefined) {
      onThemeChange(preset);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-12)" }}>
      <OdField label="Theme Palette Preset" htmlFor="theme-preset-select">
        <select
          id="theme-preset-select"
          className="od-select"
          style={{ width: "100%" }}
          defaultValue=""
          onChange={(e) => handlePresetSelect(e.target.value)}
        >
          <option value="">Custom / None</option>
          {Object.keys(PALETTE_PRESETS).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </OdField>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--od-8)" }}>
        {THEME_PALETTE_SLOTS.map((slot) => {
          const val = currentTheme[slot] ?? "";
          const colorInputVal =
            val.startsWith("#") && (val.length === 7 || val.length === 4) ? val : "#ffffff";

          return (
            <div
              key={slot}
              style={{ display: "flex", flexDirection: "column", gap: "var(--od-4)" }}
            >
              <label
                htmlFor={`theme-slot-${slot}`}
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  textTransform: "capitalize",
                  color: "var(--od-text-secondary)",
                }}
              >
                {slot}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--od-4)" }}>
                <input
                  type="color"
                  value={colorInputVal}
                  aria-label={`${slot} color picker`}
                  style={{
                    width: "28px",
                    height: "28px",
                    padding: 0,
                    border: "var(--od-border-width) solid var(--od-border)",
                    borderRadius: "var(--od-radius-sm)",
                    cursor: "pointer",
                    background: "none",
                  }}
                  onChange={(e) => handleSlotChange(slot, e.target.value)}
                />
                <input
                  id={`theme-slot-${slot}`}
                  type="text"
                  className="od-input"
                  style={{ width: "100%", fontSize: "12px", padding: "4px 6px" }}
                  placeholder="#hex"
                  value={val}
                  onChange={(e) => handleSlotChange(slot, e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {theme !== undefined && (
        <button
          type="button"
          className="od-btn od-btn--ghost"
          style={{ width: "100%", fontSize: "12px", marginTop: "var(--od-4)" }}
          onClick={() => onThemeChange(undefined)}
        >
          Clear Theme Palette
        </button>
      )}
    </div>
  );
}
