import React from "react";
import {
  type CreativityLevel,
  CREATIVITY_LEVEL_DEFINITIONS,
  DEFAULT_CREATIVITY_LEVEL,
} from "@open-draw/contracts";

export interface AiCreativityMeterProps {
  readonly creativityLevel: CreativityLevel;
  readonly setCreativityLevel: React.Dispatch<React.SetStateAction<CreativityLevel>>;
}

const LEVEL_CARD_STYLE: React.CSSProperties = {
  backgroundColor: "var(--od-bg)",
  border: "var(--od-border-width) solid var(--od-border)",
  borderRadius: "var(--od-radius-sm)",
  padding: "var(--od-12) var(--od-16)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--od-4)",
};

export function AiCreativityMeter(props: AiCreativityMeterProps): React.JSX.Element {
  const { creativityLevel, setCreativityLevel } = props;
  const currentDef = CREATIVITY_LEVEL_DEFINITIONS[creativityLevel];

  const handleMeterKeyDown = (e: React.KeyboardEvent) => {
    const d =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? -1
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? 1
          : 0;
    if (d !== 0) {
      e.preventDefault();
      setCreativityLevel((p) => Math.min(5, Math.max(1, p + d)) as CreativityLevel);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="od-section-header">AI Creativity Meter</span>
        <span className="od-meta">Defines AI implementation freedom</span>
      </div>

      <div
        className="od-meter-track"
        role="radiogroup"
        aria-label="AI Creativity Level"
        onKeyDown={handleMeterKeyDown}
      >
        {([1, 2, 3, 4, 5] as const).map((level) => {
          const def = CREATIVITY_LEVEL_DEFINITIONS[level];
          const isActive = creativityLevel === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setCreativityLevel(level)}
              className={`od-meter-segment${isActive ? " od-meter-segment--active" : ""}`}
              aria-label={`Level ${level} ${def.name}: ${def.description}`}
            >
              <span className="od-meter-segment__title">{def.name}</span>
              <span className="od-meter-segment__level">Level {level}</span>
            </button>
          );
        })}
      </div>

      <div className="od-meter-pointer-row" aria-hidden="true">
        {([1, 2, 3, 4, 5] as const).map((level) => (
          <div key={level} className="od-meter-pointer-col">
            {creativityLevel === level && <div className="od-meter-pointer-arrow" />}
          </div>
        ))}
      </div>

      <div style={LEVEL_CARD_STYLE}>
        <span
          style={{
            fontSize: "var(--od-text-xs)",
            fontWeight: 600,
            color: "var(--od-text)",
          }}
        >
          Level {currentDef.level} — {currentDef.name}
          {currentDef.level === DEFAULT_CREATIVITY_LEVEL ? " (Default)" : ""}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: "var(--od-text-xs)",
            color: "var(--od-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          {currentDef.description}
        </p>
      </div>
    </div>
  );
}
