import React, { useEffect, useState } from "react";
import { OdToastProvider } from "@open-draw/ui";
import { LandingPage } from "./components/LandingPage";
import { StudioShell } from "./components/StudioShell";

export default function App(): React.JSX.Element {
  const [view, setView] = useState<"landing" | "studio">(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash === "#app" || hash === "#studio" || path.endsWith("/app")) {
        return "studio";
      }
    }
    return "landing";
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#app" || hash === "#studio") {
        setView("studio");
      } else if (!hash || hash === "#" || hash === "#home") {
        setView("landing");
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleLaunch = (): void => {
    setView("studio");
    if (typeof window !== "undefined") {
      window.location.hash = "app";
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
        <StudioShell onBackToLanding={handleBackToLanding} />
      )}
    </OdToastProvider>
  );
}
