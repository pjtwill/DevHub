import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { CommandPalette } from "@/components/CommandPalette";

export function AppLayout() {
  const [commandOpen, setCommandOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCommandOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen flex">
      {/* Accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[hsl(280,84%,67%)] to-primary z-50" />
      <AppSidebar />
      <div className="flex-1 ml-56 flex flex-col">
        <TopBar onOpenCommand={() => setCommandOpen(true)} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
