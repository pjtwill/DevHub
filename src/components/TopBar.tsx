import { Search, Plus, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  onAddProject?: () => void;
}

export function TopBar({ onAddProject }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-9 bg-secondary border-border h-9 text-sm placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10 border border-success/20">
          <Github className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-medium text-success">Connected</span>
        </div>
        <Button size="sm" className="gap-2" onClick={onAddProject}>
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>
    </header>
  );
}
