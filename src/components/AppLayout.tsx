import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { CommandPalette } from "@/components/CommandPalette";
import { useKeyboardShortcuts, ShortcutAction } from "@/hooks/useKeyboardShortcuts";
import { CreateRepoModal } from "@/components/CreateRepoModal";
import { ShortcutsHelpModal } from "@/components/ShortcutsHelpModal";
import { useGitHubUser } from "@/contexts/GitHubUserContext";

export function AppLayout() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [createRepoOpen, setCreateRepoOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const { refreshRepos } = useGitHubUser();

  const handleAction = useCallback(
    (action: ShortcutAction) => {
      switch (action) {
        case "commandPalette":
          setCommandOpen((o) => !o);
          break;
        case "newRepo":
          setCreateRepoOpen(true);
          break;
        case "refreshData":
          refreshRepos();
          break;
        case "showHelp":
          setHelpOpen(true);
          break;
      }
    },
    [refreshRepos]
  );

  useKeyboardShortcuts({ onAction: handleAction });

  return (
    <div className="min-h-screen flex">
      {/* Accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-[hsl(280,84%,67%)] to-primary z-50" />
      <AppSidebar />
      <div className="flex-1 ml-56 flex flex-col">
        <TopBar
          onOpenCommand={() => setCommandOpen(true)}
          onAddProject={() => setCreateRepoOpen(true)}
        />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <CreateRepoModal open={createRepoOpen} onClose={() => setCreateRepoOpen(false)} />
      <ShortcutsHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
