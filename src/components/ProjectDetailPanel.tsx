import { useState, useEffect } from "react";
import { X, GitCommit, GitBranch, FolderOpen, ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project } from "@/data/types";
import { getProjectCommits, getProjectBranches } from "@/data/projectDetailData";
import { getLanguageConfig } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  synced: { label: "Synced", className: "bg-success" },
  uncommitted: { label: "Uncommitted", className: "bg-warning" },
  behind: { label: "Behind", className: "bg-destructive" },
};

interface ProjectDetailPanelProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  const [tab, setTab] = useState<"commits" | "branches">("commits");
  const [closing, setClosing] = useState(false);

  // Reset tab when project changes
  useEffect(() => {
    if (project) {
      setTab("commits");
      setClosing(false);
    }
  }, [project?.id]);

  if (!project) return null;

  const lang = getLanguageConfig(project.language);
  const status = statusConfig[project.syncStatus];
  const commits = getProjectCommits(project.id).slice(0, 10);
  const branches = getProjectBranches(project.id);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-200",
          closing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[480px] bg-card border-l border-border z-50 flex flex-col",
          closing ? "animate-slide-out-right" : "animate-slide-in-right"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: `${lang.color}15`, color: lang.color }}
            >
              {lang.icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">{project.name}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>{project.language}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {project.branch}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full", status.className)} />
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Button
            size="sm"
            className="gap-1.5 text-xs h-8 bg-info hover:bg-info/80 text-info-foreground"
            onClick={() => toast.success("Opening in VS Code...", { description: project.localPath })}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Open in VS Code
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => toast.info("Syncing with remote...")}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Push / Pull
          </Button>
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-8 text-muted-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
              GitHub
            </Button>
          </a>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("commits")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2",
              tab === "commits"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <GitCommit className="h-3.5 w-3.5" />
            Commits
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{commits.length}</span>
          </button>
          <button
            onClick={() => setTab("branches")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2",
              tab === "branches"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Branches
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{branches.length}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === "commits" ? (
            <div className="divide-y divide-border">
              {commits.map((c, i) => (
                <div
                  key={c.hash}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex flex-col items-center mt-1.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                    {i < commits.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{c.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{c.hash}</span>
                      <span>·</span>
                      <span>{c.author}</span>
                      <span>·</span>
                      <span>{c.time}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono flex-shrink-0 mt-0.5">
                    {c.branch}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {branches.map((b, i) => (
                <div
                  key={b.name}
                  className="px-5 py-4 hover:bg-surface-hover transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-sm font-medium text-foreground font-mono">{b.name}</span>
                    {b.isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-[22px] text-xs text-muted-foreground">
                    <span className="font-mono">{b.lastCommit}</span>
                    <span>·</span>
                    <span>{b.aheadBehind}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono truncate">
            {project.localPath}
          </p>
        </div>
      </div>
    </>
  );
}
