import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Star, RefreshCw, Loader2, GitCommit, GitBranch, ExternalLink, Search, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { getLanguageConfig } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface StarredRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  html_url: string;
  default_branch: string;
}

type SortKey = "updated" | "stars" | "name";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Recently Updated" },
  { key: "stars", label: "Most Stars" },
  { key: "name", label: "Name A–Z" },
];

function getHeaders() {
  const token = localStorage.getItem("devhub_github_token");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export default function StarredPage() {
  const [repos, setRepos] = useState<StarredRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [langFilter, setLangFilter] = useState("All");
  const [unstarring, setUnstarring] = useState<number | null>(null);

  // Recent push updates from starred repos
  const [updates, setUpdates] = useState<StarredRepo[]>([]);

  const fetchStarred = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api.github.com/user/starred?sort=updated&per_page=50",
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error();
      const data: StarredRepo[] = await res.json();
      setRepos(data);
      // Recent updates = repos pushed in the last ~7 days, take top 10
      const recent = [...data]
        .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
        .slice(0, 10);
      setUpdates(recent);
    } catch {
      toast.error("Failed to load starred repos");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStarred().finally(() => setLoading(false));
  }, [fetchStarred]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStarred();
    setRefreshing(false);
    toast.success("Starred repos refreshed");
  };

  const handleUnstar = async (repo: StarredRepo) => {
    setUnstarring(repo.id);
    try {
      const res = await fetch(
        `https://api.github.com/user/starred/${repo.owner.login}/${repo.name}`,
        { method: "DELETE", headers: getHeaders() }
      );
      if (!res.ok && res.status !== 204) throw new Error();
      setRepos((prev) => prev.filter((r) => r.id !== repo.id));
      setUpdates((prev) => prev.filter((r) => r.id !== repo.id));
      toast.success(`Unstarred ${repo.full_name}`);
    } catch {
      toast.error("Failed to unstar repository");
    } finally {
      setUnstarring(null);
    }
  };

  const languages = useMemo(
    () => Array.from(new Set(repos.map((r) => r.language).filter(Boolean) as string[])).sort(),
    [repos]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = repos.filter((r) => {
      if (q && !r.full_name.toLowerCase().includes(q) && !(r.description || "").toLowerCase().includes(q)) return false;
      if (langFilter !== "All" && r.language !== langFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "updated": return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
        case "stars": return b.stargazers_count - a.stargazers_count;
        case "name": return a.full_name.localeCompare(b.full_name);
        default: return 0;
      }
    });
    return list;
  }, [repos, search, langFilter, sortBy]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Starred</h1>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {repos.length}
          </span>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" disabled={refreshing} onClick={handleRefresh}>
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-5 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : repos.length === 0 ? (
        <EmptyState
          icon={Star}
          title="You haven't starred any repos yet"
          subtitle="Star repositories on GitHub and they'll appear here"
        />
      ) : (
        <>
          {/* Recent Updates */}
          {updates.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-foreground mb-3">Recent Updates</h2>
              <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
                {updates.slice(0, 5).map((repo) => {
                  const ago = formatDistanceToNow(new Date(repo.pushed_at), { addSuffix: true });
                  return (
                    <div key={repo.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors animate-fade-in">
                      <img src={repo.owner.avatar_url} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{repo.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <GitBranch className="h-3 w-3" />
                          <span>{repo.default_branch}</span>
                          <span>·</span>
                          <span>{ago}</span>
                        </div>
                      </div>
                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Search + Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search starred repos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sort chips */}
              <div className="flex bg-secondary rounded-md p-0.5">
                {sortOptions.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                      sortBy === s.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.label}
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

            <span className="text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((repo, i) => {
                const lang = getLanguageConfig(repo.language || "");
                const ago = formatDistanceToNow(new Date(repo.pushed_at), { addSuffix: true });
                return (
                  <div
                    key={repo.id}
                    className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02] animate-scale-in"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: "backwards" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={repo.owner.avatar_url} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                        <div className="min-w-0">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
                          >
                            {repo.full_name}
                          </a>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 flex-shrink-0 text-warning hover:text-warning/70"
                        disabled={unstarring === repo.id}
                        onClick={() => handleUnstar(repo)}
                      >
                        {unstarring === repo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="h-4 w-4 fill-current" />
                        )}
                      </Button>
                    </div>

                    {repo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{repo.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-auto text-xs text-muted-foreground">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {repo.stargazers_count.toLocaleString()}
                      </span>
                      <span className="ml-auto">{ago}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No matching repos"
              subtitle="Try adjusting your search or filters"
              compact
            />
          )}
        </>
      )}
    </div>
  );
}
