import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderKanban, Lock, Star, GitFork, TrendingUp, Calendar, BarChart3,
  Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGitHubUser } from "@/contexts/GitHubUserContext";
import { toast } from "sonner";
import { format, subMonths, getDay, startOfMonth } from "date-fns";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart,
} from "recharts";

// GitHub official language colors
const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
  C: "#555555", "C++": "#f34b7d", "C#": "#178600", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", Shell: "#89e051",
  HTML: "#e34c26", CSS: "#563d7c", Vue: "#41b883", Svelte: "#ff3e00",
  Lua: "#000080", Scala: "#c22d40", Haskell: "#5e5086", Elixir: "#6e4a7e",
  Jupyter: "#DA5B0B", R: "#198CE7", SCSS: "#c6538c", Zig: "#ec915c",
  Nix: "#7e7eff", HCL: "#844FBA", Dockerfile: "#384d54", Makefile: "#427819",
};

function getLangColor(lang: string) {
  return LANG_COLORS[lang] || `hsl(${Math.abs(lang.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360}, 50%, 55%)`;
}

interface RepoFull {
  id: number; name: string; full_name: string; language: string | null;
  stargazers_count: number; forks_count: number; private: boolean;
  created_at: string; pushed_at: string;
}

interface EventItem {
  type: string; created_at: string;
  payload: { size?: number; commits?: unknown[] };
}

function getHeaders() {
  const token = localStorage.getItem("devhub_github_token");
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
}

export default function StatsPage() {
  const { user } = useGitHubUser();
  const [repos, setRepos] = useState<RepoFull[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [reposRes, eventsRes] = await Promise.all([
        fetch("https://api.github.com/user/repos?per_page=100&sort=pushed", { headers: getHeaders() }),
        fetch(`https://api.github.com/users/${user.login}/events?per_page=100`, { headers: getHeaders() }),
      ]);
      if (reposRes.ok) setRepos(await reposRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Stats refreshed");
  };

  // ── Language stats ──
  const langStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of repos) {
      if (r.language) map[r.language] = (map[r.language] || 0) + 1;
    }
    const total = repos.filter((r) => r.language).length || 1;
    return Object.entries(map)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100), color: getLangColor(name) }))
      .sort((a, b) => b.count - a.count);
  }, [repos]);

  // ── Commit activity ──
  const pushEvents = useMemo(() => events.filter((e) => e.type === "PushEvent"), [events]);

  const commitsByDow = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const e of pushEvents) {
      const d = getDay(new Date(e.created_at));
      counts[d] += e.payload.size || e.payload.commits?.length || 1;
    }
    return days.map((name, i) => ({ name, commits: counts[i] }));
  }, [pushEvents]);

  const monthlyActivity = useMemo(() => {
    const now = new Date();
    const months: { name: string; commits: number; key: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = subMonths(now, i);
      const key = format(m, "yyyy-MM");
      months.push({ name: format(m, "MMM"), commits: 0, key });
    }
    for (const e of pushEvents) {
      const key = format(new Date(e.created_at), "yyyy-MM");
      const found = months.find((m) => m.key === key);
      if (found) found.commits += e.payload.size || e.payload.commits?.length || 1;
    }
    return months;
  }, [pushEvents]);

  const commitCounts = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = startOfMonth(now);
    let week = 0, month = 0, year = 0;
    for (const e of pushEvents) {
      const d = new Date(e.created_at);
      const c = e.payload.size || e.payload.commits?.length || 1;
      if (d >= weekAgo) week += c;
      if (d >= monthAgo) month += c;
      year += c;
    }
    return { week, month, year };
  }, [pushEvents]);

  // ── Repo stats ──
  const repoStats = useMemo(() => {
    const pub = repos.filter((r) => !r.private).length;
    const priv = repos.filter((r) => r.private).length;
    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
    const mostStarred = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0] || null;
    const mostForked = [...repos].sort((a, b) => b.forks_count - a.forks_count)[0] || null;
    return { pub, priv, totalStars, totalForks, mostStarred, mostForked };
  }, [repos]);

  // ── Growth ──
  const reposByYear = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of repos) {
      const y = new Date(r.created_at).getFullYear().toString();
      map[y] = (map[y] || 0) + 1;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([year, count]) => ({ year, count }));
  }, [repos]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Skeleton className="h-7 w-32" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Stats</h1>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" disabled={refreshing} onClick={handleRefresh}>
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Row 1: Languages + Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Languages Donut */}
        <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
          <h2 className="text-sm font-semibold text-foreground mb-4">Languages</h2>
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={langStats}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    dataKey="count" nameKey="name"
                    strokeWidth={2} stroke="hsl(0 0% 6.7%)"
                  >
                    {langStats.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip
                    contentStyle={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 15%)", borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: "hsl(0 0% 95%)" }}
                    formatter={(value: number, name: string) => [`${value} repos`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 max-h-44 overflow-y-auto">
              {langStats.map((l) => (
                <div key={l.name} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="text-foreground flex-1 truncate">{l.name}</span>
                  <span className="text-muted-foreground text-xs">{l.pct}%</span>
                  <span className="text-muted-foreground text-xs w-12 text-right">{l.count} repos</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
          <h2 className="text-sm font-semibold text-foreground mb-4">Activity Overview</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "This week", value: commitCounts.week },
              { label: "This month", value: commitCounts.month },
              { label: "This year", value: commitCounts.year },
            ].map((s) => (
              <div key={s.label} className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-xl font-semibold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <h3 className="text-xs text-muted-foreground mb-2">Commits by day of week</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={commitsByDow}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} width={30} />
              <ReTooltip
                contentStyle={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 15%)", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [`${v} commits`]}
              />
              <Bar dataKey="commits" fill="hsl(239 84% 67%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly activity chart */}
      <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
        <h2 className="text-sm font-semibold text-foreground mb-4">Monthly Activity (Last 12 Months)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthlyActivity}>
            <defs>
              <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(239 84% 67%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(239 84% 67%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} width={30} />
            <ReTooltip
              contentStyle={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 15%)", borderRadius: 6, fontSize: 12 }}
              formatter={(v: number) => [`${v} commits`]}
            />
            <Area type="monotone" dataKey="commits" stroke="hsl(239 84% 67%)" fill="url(#commitGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Repo Stats */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Repository Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: "Public Repos", value: repoStats.pub, icon: FolderKanban, color: "text-primary" },
            { label: "Private Repos", value: repoStats.priv, icon: Lock, color: "text-muted-foreground" },
            { label: "Total Stars", value: repoStats.totalStars, icon: Star, color: "text-warning" },
            { label: "Total Forks", value: repoStats.totalForks, icon: GitFork, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Most starred / forked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {repoStats.mostStarred && (
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 animate-fade-in">
              <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Most Starred</p>
                <p className="text-sm font-semibold text-foreground truncate">{repoStats.mostStarred.name}</p>
              </div>
              <span className="text-lg font-semibold text-foreground">{repoStats.mostStarred.stargazers_count}</span>
            </div>
          )}
          {repoStats.mostForked && (
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 animate-fade-in">
              <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center flex-shrink-0">
                <GitFork className="h-5 w-5 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Most Forked</p>
                <p className="text-sm font-semibold text-foreground truncate">{repoStats.mostForked.name}</p>
              </div>
              <span className="text-lg font-semibold text-foreground">{repoStats.mostForked.forks_count}</span>
            </div>
          )}
        </div>
      </div>

      {/* Growth - Repos per year */}
      {reposByYear.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
          <h2 className="text-sm font-semibold text-foreground mb-4">Repos Created Per Year</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={reposByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <ReTooltip
                contentStyle={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 15%)", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [`${v} repos`]}
              />
              <Bar dataKey="count" fill="hsl(152 55% 52%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
