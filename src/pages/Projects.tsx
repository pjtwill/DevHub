import { useState, useMemo } from "react";
import {
  LayoutGrid, List, GitBranch, FolderOpen, ArrowUpDown, Plus, FolderKanban,
  Search, ChevronDown, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetailPanel } from "@/components/ProjectDetailPanel";
import { CreateRepoModal } from "@/components/CreateRepoModal";
import { EmptyState } from "@/components/EmptyState";
import { getLanguageConfig } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useGitHubUser, type GitHubRepo } from "@/contexts/GitHubUserContext";
import { formatDistanceToNow, isAfter, subDays } from "date-fns";

// ── RepoRow (list view) ──────────────────────────────────────────────
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
        <Button size="sm" className="gap-1 text-xs h-7 px-2.5 bg-info hover:bg-info/80 text-info-foreground" onClick={() => toast.success("Opening in VS Code...", { description: repo.name })}>
          <FolderOpen className="h-3 w-3" /> VS Code
        </Button>
        <Button size="sm" variant="outline" className="gap-1 text-xs h-7 px-2.5" onClick={() => toast.info("Syncing with remote...")}>
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
        <div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-16" /></div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-40" />
      <div className="flex gap-2"><Skeleton className="h-8 flex-1" /><Skeleton className="h-8 flex-1" /></div>
    </div>
  );
}

// ── Sort options ──────────────────────────────────────────────────────
type SortKey = "pushed" | "name" | "stars" | "issues";
const sortOptions: { key: SortKey; label: string }[] = [
  { key: "pushed", label: "Last pushed" },
  { key: "name", label: "Name A–Z" },
  { key: "stars", label: "Most stars" },
  { key: "issues", label: "Most issues" },
];

// ── Filter chips ──────────────────────────────────────────────────────
type FilterChip = "all" | "public" | "private" | "has_issues" | "has_prs" | "recent";
const filterChips: { key: FilterChip; label: string }[] = [
  { key: "all", label: "All" },
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
  { key: "has_issues", label: "Has Issues" },
  { key: "has_prs", label: "Has PRs" },
  { key: "recent", label: "Recently Updated" },
];

export default function Projects() {
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("All");
  const [chipFilter, setChipFilter] = useState<FilterChip>("all");
  const [sortBy, setSortBy] = useState<SortKey>("pushed");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const { repos, reposLoading } = useGitHubUser();

  const languages = useMemo(
    () => Array.from(new Set(repos.map((r) => r.language).filter(Boolean) as string[])).sort(),
    [repos]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const sevenDaysAgo = subDays(new Date(), 7);

    let list = repos.filter((r) => {
      // search
      if (q && !r.name.toLowerCase().includes(q) && !(r.description || "").toLowerCase().includes(q)) return false;
      // language
      if (langFilter !== "All" && r.language !== langFilter) return false;
      // chip
      if (chipFilter === "public" && r.private) return false;
      if (chipFilter === "private" && !r.private) return false;
      if (chipFilter === "has_issues" && r.open_issues_count === 0) return false;
      if (chipFilter === "has_prs" && r.open_issues_count === 0) return false; // GH counts PRs in open_issues
      if (chipFilter === "recent" && !isAfter(new Date(r.pushed_at), sevenDaysAgo)) return false;
      return true;
    });

    // sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "pushed": return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        case "name": return a.name.localeCompare(b.name);
        case "stars": return b.stargazers_count - a.stargazers_count;
        case "issues": return b.open_issues_count - a.open_issues_count;
        default: return 0;
      }
    });

    return list;
  }, [repos, search, langFilter, chipFilter, sortBy]);

  const activeFilters = (search ? 1 : 0) + (langFilter !== "All" ? 1 : 0) + (chipFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setLangFilter("All");
    setChipFilter("all");
    setSortBy("pushed");
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Projects</h1>
          <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Project
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                <ArrowUpDown className="h-3 w-3" />
                {sortOptions.find((s) => s.key === sortBy)?.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((s) => (
                <DropdownMenuItem
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={cn("text-xs", sortBy === s.key && "bg-accent")}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex bg-secondary rounded-md p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn("p-1.5 rounded transition-colors", view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-1.5 rounded transition-colors", view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repos by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status chips */}
        <div className="flex bg-secondary rounded-md p-0.5">
          {filterChips.map((c) => (
            <button
              key={c.key}
              onClick={() => setChipFilter(c.key)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                chipFilter === c.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Language badges */}
        {languages.length > 0 && (
          <>
            <div className="w-px h-5 bg-border" />
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setLangFilter("All")}
                className={cn(
                  "px-2 py-0.5 text-[11px] font-medium rounded-full border transition-colors",
                  langFilter === "All"
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                All langs
              </button>
              {languages.map((l) => {
                const lc = getLanguageConfig(l);
                return (
                  <button
                    key={l}
                    onClick={() => setLangFilter(langFilter === l ? "All" : l)}
                    className={cn(
                      "px-2 py-0.5 text-[11px] font-medium rounded-full border transition-colors flex items-center gap-1",
                      langFilter === l
                        ? "border-primary/30 bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    )}
                  >
                    <span style={{ color: lc.color }} className="text-[10px]">{lc.icon}</span>
                    {l}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Results count + clear */}
      {!reposLoading && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="text-xs text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {reposLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r, i) => (
              <div
                key={r.id}
                className="animate-scale-in"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
              >
                <ProjectCard repo={r} onClick={() => setSelectedRepo(r)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
            {filtered.map((r, i) => (
              <RepoRow
                key={r.id}
                repo={r}
                onClick={() => setSelectedRepo(r)}
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={FolderKanban}
          secondaryIcon={Plus}
          title={activeFilters > 0 ? "No matching repos" : "No projects yet"}
          subtitle={activeFilters > 0 ? "Try adjusting your filters or search query" : "Add your first project or link a GitHub repo to get started"}
          actions={
            activeFilters > 0
              ? [{ label: "Clear Filters", onClick: clearFilters }]
              : [
                  { label: "Add Project", onClick: () => setCreateOpen(true) },
                  { label: "Browse GitHub Repos", variant: "outline" as const, onClick: () => navigate("/github") },
                ]
          }
        />
      )}

      <ProjectDetailPanel repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
      <CreateRepoModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(repo) => setSelectedRepo(repo)} />
    </div>
  );
}
