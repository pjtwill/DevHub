import { GitBranch, ExternalLink, FolderOpen, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project } from "@/data/types";
import { getLanguageConfig } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  synced: { label: "Synced", className: "bg-success" },
  uncommitted: { label: "Uncommitted", className: "bg-warning" },
  behind: { label: "Behind", className: "bg-destructive" },
};

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const lang = getLanguageConfig(project.language);
  const status = statusConfig[project.syncStatus];

  return (
    <div
      className="group bg-card border border-border rounded-lg p-5 transition-all duration-200 ease-out hover:border-primary/30 hover:bg-surface-hover hover:scale-[1.02] animate-fade-in cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: `${lang.color}15`, color: lang.color }}
          >
            {lang.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
            <span className="text-xs text-muted-foreground">{project.language}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full animate-pulse-dot", status.className)} />
          <span className="text-xs text-muted-foreground">{status.label}</span>
        </div>
      </div>

      {/* GitHub info */}
      <a
        href={project.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
      >
        <ExternalLink className="h-3 w-3" />
        <span className="font-mono truncate">{project.lastCommitHash}</span>
        <span className="mx-1">·</span>
        <span className="truncate">{project.lastCommitMessage}</span>
      </a>

      {/* Branch + path */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          {project.branch}
        </span>
        <span className="flex items-center gap-1 truncate">
          <FolderOpen className="h-3 w-3" />
          <span className="font-mono truncate">{project.localPath}</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          className="flex-1 gap-1.5 text-xs h-8 bg-info hover:bg-info/80 text-info-foreground"
          onClick={() => toast.success("Opening in VS Code...", { description: project.localPath })}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Open in VS Code
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-xs h-8"
          onClick={() => toast.info("Syncing with remote...")}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Push / Pull
        </Button>
      </div>
    </div>
  );
}
