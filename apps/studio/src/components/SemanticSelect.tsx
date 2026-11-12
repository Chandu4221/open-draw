import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PlatformProfile } from "@open-draw/contracts";
import { OdIcon } from "@open-draw/ui";
import {
  buildFlatSemanticOptions,
  filterSemanticDefinitions,
  getNextHighlightedIndex,
  groupProfileSemantics,
  loadRecentSemanticTags,
  resolveRecentDefinitions,
  saveRecentSemanticTag,
} from "./semantic-select-helpers";
import { SemanticOptionsList } from "./SemanticOptionsList";

export interface SemanticSelectProps {
  readonly id?: string;
  readonly activeProfile: PlatformProfile | undefined;
  readonly selectedTag: string;
  readonly onSelect: (semanticId: string) => void;
  readonly placeholder?: string;
  readonly initialOpen?: boolean;
  readonly initialQuery?: string;
}

export function SemanticSelect({
  id = "semantic-tag-select",
  activeProfile,
  selectedTag,
  onSelect,
  placeholder = "(None / Baseline)",
  initialOpen = false,
  initialQuery = "",
}: SemanticSelectProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [query, setQuery] = useState(initialQuery);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedDef = selectedTag ? activeProfile?.semantics[selectedTag] : undefined;

  const groupedSemantics = useMemo(() => groupProfileSemantics(activeProfile), [activeProfile]);

  const recentDefs = useMemo(() => {
    const tags = loadRecentSemanticTags(activeProfile?.id);
    return resolveRecentDefinitions(activeProfile, tags);
  }, [activeProfile]);

  const allDefs = useMemo(() => {
    if (!activeProfile) return [];
    return Object.values(activeProfile.semantics).filter(
      (def) => def.id !== activeProfile.rootSemantic,
    );
  }, [activeProfile]);

  const cleanQuery = query.trim().toLowerCase();

  const filteredMatches = useMemo(
    () => filterSemanticDefinitions(allDefs, query),
    [allDefs, query],
  );

  const flatOptions = useMemo(
    () =>
      buildFlatSemanticOptions({
        placeholder,
        query,
        recentDefs,
        groupedSemantics,
        filteredMatches,
        selectedTag,
        activeProfile,
      }),
    [placeholder, query, recentDefs, groupedSemantics, filteredMatches, selectedTag, activeProfile],
  );

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  const handleSelect = (semanticId: string) => {
    if (semanticId) saveRecentSemanticTag(semanticId, activeProfile?.id);
    onSelect(semanticId);
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => getNextHighlightedIndex(prev, flatOptions.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => getNextHighlightedIndex(prev, flatOptions.length, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatOptions[highlightedIndex];
      if (target) handleSelect(target.id);
    }
  };

  return (
    <div ref={containerRef} className="od-combobox" onKeyDown={handleKeyDown}>
      <div
        id={id}
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-popover`}
        className={`od-combobox-trigger ${isOpen ? "od-combobox-trigger--open" : ""}`}
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setHighlightedIndex(0);
          }
        }}
      >
        {isOpen ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--od-6)",
              flex: 1,
              minWidth: 0,
            }}
          >
            <OdIcon
              name="search"
              size={14}
              style={{ color: "var(--od-text-tertiary)", flexShrink: 0 }}
            />
            <input
              ref={inputRef}
              type="search"
              className="od-combobox-search-input"
              placeholder="Search semantic tags..."
              aria-label="Search semantic tags"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span className="od-combobox-trigger__label">
            {selectedDef ? (
              <>
                <span>{selectedDef.displayName}</span>
                <span className="od-meta">{`(${selectedDef.id})`}</span>
              </>
            ) : selectedTag ? (
              <span>{selectedTag}</span>
            ) : (
              <span style={{ color: "var(--od-text-secondary)" }}>{placeholder}</span>
            )}
          </span>
        )}

        <span className="od-combobox-trigger__icons">
          {selectedTag && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear semantic tag"
              className="od-combobox-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  handleSelect("");
                }
              }}
            >
              <OdIcon name="close" size={14} />
            </span>
          )}
          <span
            role="button"
            tabIndex={0}
            aria-label="Toggle semantic dropdown"
            className="od-combobox-clear-btn"
            onClick={(e) => {
              if (isOpen) {
                e.stopPropagation();
                setIsOpen(false);
              }
            }}
          >
            <OdIcon
              name="chevron"
              size={14}
              style={{
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            />
          </span>
        </span>
      </div>

      {isOpen && (
        <SemanticOptionsList
          id={id}
          placeholder={placeholder}
          cleanQuery={cleanQuery}
          query={query}
          selectedTag={selectedTag}
          highlightedIndex={highlightedIndex}
          recentDefs={recentDefs}
          groupedSemantics={groupedSemantics}
          filteredMatches={filteredMatches}
          activeProfile={activeProfile}
          onSelect={handleSelect}
          onHoverIndex={setHighlightedIndex}
        />
      )}
    </div>
  );
}
