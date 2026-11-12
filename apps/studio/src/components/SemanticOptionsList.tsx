import React from "react";
import type { PlatformProfile, SemanticDefinition } from "@open-draw/contracts";
import type { SemanticGroup } from "./semantic-select-helpers";

export interface SemanticOptionsListProps {
  readonly id: string;
  readonly placeholder: string;
  readonly cleanQuery: string;
  readonly query: string;
  readonly selectedTag: string;
  readonly highlightedIndex: number;
  readonly recentDefs: readonly SemanticDefinition[];
  readonly groupedSemantics: readonly SemanticGroup[];
  readonly filteredMatches: readonly SemanticDefinition[];
  readonly activeProfile: PlatformProfile | undefined;
  readonly onSelect: (semanticId: string) => void;
  readonly onHoverIndex: (index: number) => void;
}

export function SemanticOptionsList({
  id,
  placeholder,
  cleanQuery,
  query,
  selectedTag,
  highlightedIndex,
  recentDefs,
  groupedSemantics,
  filteredMatches,
  activeProfile,
  onSelect,
  onHoverIndex,
}: SemanticOptionsListProps): React.JSX.Element {
  let globalIndex = 0;

  const renderOptionRow = (item: { id: string; displayName: string }, index: number) => {
    const isSelected = item.id === selectedTag;
    const isHighlighted = index === highlightedIndex;

    return (
      <li
        key={item.id ? item.id : "baseline-option"}
        id={`${id}-option-${index}`}
        role="option"
        aria-selected={isSelected}
        className={`od-combobox-option ${isSelected ? "od-combobox-option--selected" : ""} ${
          isHighlighted ? "od-combobox-option--highlighted" : ""
        }`}
        onClick={() => onSelect(item.id)}
        onMouseEnter={() => onHoverIndex(index)}
      >
        <span>{item.displayName}</span>
        {item.id && <span className="od-combobox-option__id">{item.id}</span>}
      </li>
    );
  };

  return (
    <div id={`${id}-popover`} className="od-combobox-popover">
      <ul className="od-combobox-list" role="listbox">
        {renderOptionRow({ id: "", displayName: placeholder }, globalIndex++)}

        {!cleanQuery ? (
          <>
            {recentDefs.length > 0 && (
              <>
                <div className="od-combobox-group-header">Recently Used</div>
                {recentDefs.map((def) => renderOptionRow(def, globalIndex++))}
              </>
            )}

            {selectedTag && !activeProfile?.semantics[selectedTag] && (
              <>
                <div className="od-combobox-group-header">Foreign Platform</div>
                {renderOptionRow(
                  {
                    id: selectedTag,
                    displayName: `[Foreign] ${selectedTag}`,
                  },
                  globalIndex++,
                )}
              </>
            )}

            {groupedSemantics.map((group) => (
              <React.Fragment key={group.category}>
                <div className="od-combobox-group-header">
                  {group.title} ({group.items.length})
                </div>
                {group.items.map((item) => renderOptionRow(item, globalIndex++))}
              </React.Fragment>
            ))}
          </>
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((item) => renderOptionRow(item, globalIndex++))
        ) : (
          <div className="od-combobox-empty">
            No matching semantics found for &quot;{query}&quot;
          </div>
        )}
      </ul>
    </div>
  );
}
