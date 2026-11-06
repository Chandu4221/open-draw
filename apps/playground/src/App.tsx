import React, { useEffect, useState } from "react";
import { OdToastProvider } from "@open-draw/ui";
import { LandingPage } from "./components/LandingPage";
import { PlaygroundShell } from "./components/PlaygroundShell";

export default function App(): React.JSX.Element {
  const [view, setView] = useState<"landing" | "playground">(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (
        hash === "#app" ||
        hash === "#playground" ||
        path.endsWith("/app") ||
        path.endsWith("/playground")
      ) {
        return "playground";
      }
    }
    return "landing";
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#app" || hash === "#playground") {
        setView("playground");
      } else if (!hash || hash === "#" || hash === "#home") {
        setView("landing");
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleLaunch = (): void => {
    setView("playground");
    if (typeof window !== "undefined") {
      window.location.hash = "playground";
    }
  };

  const handleBackToLanding = (): void => {
    setView("landing");
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
  };

  return (
    <OdToastProvider>
      {view === "landing" ? (
        <LandingPage onLaunch={handleLaunch} />
      ) : (
        <PlaygroundShell onBackToLanding={handleBackToLanding} />
      )}
    </OdToastProvider>
  );
}
