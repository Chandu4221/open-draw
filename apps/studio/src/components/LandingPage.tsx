import React from "react";
import { OdButton } from "@open-draw/ui";

export interface LandingPageProps {
  readonly onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "var(--od-canvas-bg)",
        fontFamily: "var(--od-font)",
        color: "var(--od-text)",
        padding: "var(--od-24)",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Top Bar / Minimal Brand */}
      <header
        style={{
          position: "absolute",
          top: "var(--od-24)",
          left: "var(--od-24)",
          right: "var(--od-24)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            OpenDraw
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "999px",
              backgroundColor: "var(--od-surface)",
              border: "1px solid var(--od-border)",
              color: "var(--od-text-secondary)",
            }}
          >
            v0.7.0
          </span>
        </div>

        <nav style={{ display: "flex", gap: "var(--od-16)", alignItems: "center" }}>
          <a
            href="https://github.com/Chandu4221/open-draw"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13px",
              color: "var(--od-text-secondary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@open-draw/canvas"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13px",
              color: "var(--od-text-secondary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            npm
          </a>
        </nav>
      </header>

      {/* Hero Card */}
      <main
        style={{
          maxWidth: "640px",
          width: "100%",
          backgroundColor: "var(--od-surface)",
          border: "1px solid var(--od-border)",
          borderRadius: "var(--od-radius)",
          padding: "48px 40px",
          boxShadow: "var(--od-shadow-floating)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--od-24)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--od-8)",
            padding: "4px 12px",
            borderRadius: "999px",
            backgroundColor: "var(--od-bg)",
            border: "1px solid var(--od-border)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--od-text-secondary)",
          }}
        >
          <span>Semantic Wireframing & Canvas Engine</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-12)" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "36px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            Wireframe Semantics.
            <br />
            Compile to Code.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              lineHeight: 1.6,
              color: "var(--od-text-secondary)",
              maxWidth: "520px",
            }}
          >
            A modular, batteries-included vector canvas SDK and AI prompt compiler. Decouple your UI
            structure from visual styling and export directly to clean AI specifications.
          </p>
        </div>

        {/* The Action */}
        <div style={{ paddingTop: "var(--od-8)" }}>
          <OdButton
            variant="primary"
            onClick={onLaunch}
            style={{
              height: "44px",
              padding: "0 36px",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRadius: "var(--od-radius)",
              cursor: "pointer",
            }}
          >
            GIVE A TRY
          </OdButton>
        </div>

        {/* Feature Highlights */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--od-16)",
            width: "100%",
            marginTop: "var(--od-16)",
            paddingTop: "var(--od-24)",
            borderTop: "1px solid var(--od-border)",
            textAlign: "left",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--od-text)" }}>
              Zero Runtime Deps
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--od-text-tertiary)",
                marginTop: "var(--od-4)",
                lineHeight: 1.4,
              }}
            >
              Pure TypeScript core with standalone npm distribution.
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--od-text)" }}>
              Platform Profiles
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--od-text-tertiary)",
                marginTop: "var(--od-4)",
                lineHeight: 1.4,
              }}
            >
              Semantic tags for Web, Android M3, Flutter, and iOS.
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--od-text)" }}>
              AI Compiler
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--od-text-tertiary)",
                marginTop: "var(--od-4)",
                lineHeight: 1.4,
              }}
            >
              Structured Markdown export with token contracts.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: "absolute",
          bottom: "var(--od-24)",
          fontSize: "12px",
          color: "var(--od-text-tertiary)",
        }}
      >
        MIT License © 2026 Chandra Shekhar · OpenDraw
      </footer>
    </div>
  );
}
