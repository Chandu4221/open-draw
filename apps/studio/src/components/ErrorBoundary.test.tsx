import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ErrorBoundary } from "./ErrorBoundary";
import { DRAFT_STORAGE_KEY } from "../use-studio-draft";

function SafeComponent(): React.JSX.Element {
  return <div data-testid="safe-child">Studio Safe Child</div>;
}

describe("ErrorBoundary", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = { [DRAFT_STORAGE_KEY]: "some-draft" };
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      length: 1,
      key: vi.fn(),
    };
    vi.stubGlobal("localStorage", mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders children when no error occurs", () => {
    const html = renderToString(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>,
    );
    expect(html).toContain("Studio Safe Child");
  });

  it("catches render errors and renders fallback UI with error message and reset option", () => {
    const boundary = new ErrorBoundary({ children: <SafeComponent /> });
    boundary.state = { hasError: true, error: new Error("Simulated render crash in Studio") };

    const rendered = boundary.render() as React.JSX.Element;
    const html = renderToString(rendered);

    expect(html).toContain("Something went wrong");
    expect(html).toContain("Simulated render crash in Studio");
    expect(html).toContain("Reset draft");
  });

  it("clears localStorage draft when resetting", () => {
    const boundary = new ErrorBoundary({ children: <SafeComponent /> });
    boundary.state = { hasError: true, error: new Error("Crash") };
    boundary.handleResetDraft();

    expect(localStorage.removeItem).toHaveBeenCalledWith(DRAFT_STORAGE_KEY);
  });
});
