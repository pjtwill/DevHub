import { useState } from "react";
import { LayoutGrid, List, GitBranch, FolderOpen, ArrowUpDown } from "lucide-react";
import { mockProjects } from "@/data/mockData";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetailPanel } from "@/components/ProjectDetailPanel";
import { SyncStatus, Project } from "@/data/types";
import { getLanguageConfig } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const languages = ["All", "React", "Node", "Python"];
const statuses: { label: string; value: SyncStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Synced", value: "synced" },
  { label: "Uncommitted", value: "uncommitted" },
  { label: "Behind", value: "behind" },
];

const statusConfig = {
  synced: { label: "Synced", className: "bg-success" },
  uncommitted: { label: "Uncommitted", className: "bg-warning" },
  behind: { label: "Behind", className: "bg-destructive" },
};

function ProjectRow({ project, onClick, style }: { project: Project; onClick: () => void; style?: React.CSSProperties }) {
  const lang = getLanguageConfig(project.language);
  const status = statusConfig[project.syncStatus];

  return (
    <div
      className="flex items-center gap-4 px-5 py-3 hover:bg-surface-hover transition-colors cursor-pointer animate-fade-in"
      onClick={onClick}
      style={style}
    >
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0"
        style={{ backgroundColor: `${lang.color}15`, color: lang.color }}
      >
        {lang.icon}
      </div>
      <div className="w-36 flex-shrink-0">
        <span className="text-sm font-medium text-foreground">{project.name}</span>
        <span className="block text-xs text-muted-foreground">{project.language}</span>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground w-28 flex-shrink-0">
        <GitBranch className="h-3 w-3" />
        {project.branch}
      </span>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-1 min-w-0 truncate">
        <span className="font-mono">{project.lastCommitHash}</span>
        <span className="mx-0.5">·</span>
        <span className="truncate">{project.lastCommitMessage}</span>
      </div>
      <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">{project.lastCommitTime}</span>
      <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
        <span className={cn("w-2 h-2 rounded-full animate-pulse-dot", status.className)} />
        <span className="text-xs text-muted-foreground">{status.label}</span>
      </div>
      <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          className="gap-1 text-xs h-7 px-2.5 bg-info hover:bg-info/80 text-info-foreground"
          onClick={() => toast.success("Opening in VS Code...", { description: project.localPath })}
        >
          <FolderOpen className="h-3 w-3" />
          VS Code
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-xs h-7 px-2.5"
          onClick={() => toast.info("Syncing with remote...")}
        >
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function Projects() {
  const [langFilter, setLangFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<SyncStatus | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filtered = mockProjects.filter((p) => {
    if (langFilter !== "All" && p.language !== langFilter) return false;
    if (statusFilter !== "all" && p.syncStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Projects</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary rounded-md p-0.5">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => setLangFilter(l)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  langFilter === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex bg-secondary rounded-md p-0.5">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === s.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex bg-secondary rounded-md p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded transition-colors",
                view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded transition-colors",
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
                <ProjectCard project={p} onClick={() => setSelectedProject(p)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
            {filtered.map((p, i) => (
              <ProjectRow key={p.id} project={p} onClick={() => setSelectedProject(p)} style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <span className="text-2xl">📂</span>
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">No projects found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
        </div>
      )}

      <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
