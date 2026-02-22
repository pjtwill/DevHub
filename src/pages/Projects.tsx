import { useState } from "react";
import { LayoutGrid, List, GitBranch, FolderOpen, ArrowUpDown, Plus, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetailPanel } from "@/components/ProjectDetailPanel";
import { EmptyState } from "@/components/EmptyState";
import { getLanguageConfig } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useGitHubUser, type GitHubRepo } from "@/contexts/GitHubUserContext";
import { formatDistanceToNow } from "date-fns";

function RepoRow({ repo, onClick, style }: { repo: GitHubRepo; onClick: () => void; style?: React.CSSProperties }) {
  const lang = getLanguageConfig(repo.language || "");
  const pushedAgo = formatDistanceToNow(new Date(repo.pushed_at), { addSuffix: true });

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
        <span className="text-sm font-medium text-foreground">{repo.name}</span>
        {repo.language && <span className="block text-xs text-muted-foreground">{repo.language}</span>}
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground w-28 flex-shrink-0">
        <GitBranch className="h-3 w-3" />
        {repo.default_branch}
      </span>
      <div className="flex-1 min-w-0 text-xs text-muted-foreground truncate">
        {repo.description || <span className="italic">No description</span>}
      </div>
      <span className="text-xs text-muted-foreground w-32 text-right flex-shrink-0">
        Updated {pushedAgo}
      </span>
      <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          className="gap-1 text-xs h-7 px-2.5 bg-info hover:bg-info/80 text-info-foreground"
          onClick={() => toast.success("Opening in VS Code...", { description: repo.name })}
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

function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-md" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export default function Projects() {
  const [langFilter, setLangFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const navigate = useNavigate();
  const { repos, reposLoading } = useGitHubUser();

  const languages = ["All", ...Array.from(new Set(repos.map((r) => r.language).filter(Boolean) as string[]))];

  const filtered = repos.filter((r) => {
    if (langFilter !== "All" && r.language !== langFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Projects</h1>
        <div className="flex items-center gap-3">
          {languages.length > 1 && (
            <div className="flex bg-secondary rounded-md p-0.5">
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => setLangFilter(l!)}
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
          )}
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

      {reposLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r, i) => (
              <div key={r.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}>
                <ProjectCard repo={r} onClick={() => setSelectedRepo(r)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
            {filtered.map((r, i) => (
              <RepoRow key={r.id} repo={r} onClick={() => setSelectedRepo(r)} style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }} />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={FolderKanban}
          secondaryIcon={Plus}
          title="No projects yet"
          subtitle="Add your first project or link a GitHub repo to get started"
          actions={[
            { label: "Add Project", onClick: () => toast.info("Add project flow coming soon") },
            { label: "Browse GitHub Repos", variant: "outline", onClick: () => navigate("/github") },
          ]}
        />
      )}

      <ProjectDetailPanel repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
    </div>
  );
}
