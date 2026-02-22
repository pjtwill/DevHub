import { Search, Plus, Github, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useGitHubUser } from "@/contexts/GitHubUserContext";

interface TopBarProps {
  onAddProject?: () => void;
  onOpenCommand?: () => void;
}

export function TopBar({ onAddProject, onOpenCommand }: TopBarProps) {
  const { user } = useGitHubUser();

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-20 mt-[2px]">
      <button
        onClick={onOpenCommand}
        className="relative w-72 flex items-center gap-2 h-9 px-3 rounded-md bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_hsl(239_84%_67%/0.15)]"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">Search or jump to...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10 border border-success/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <Github className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-medium text-success">Connected</span>
          {user && (
            <>
              <span className="text-success/40">·</span>
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar_url} alt={user.login} />
                <AvatarFallback className="text-[8px] bg-success/20 text-success">
                  {user.login.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-success">{user.login}</span>
            </>
          )}
        </div>
        <Button size="sm" className="gap-2" onClick={onAddProject}>
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>
    </header>
  );
}
