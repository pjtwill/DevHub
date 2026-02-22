import { useState, useEffect, useCallback } from "react";
import {
  FolderKanban,
  CircleDot,
  GitPullRequest,
  ArrowRight,
  Inbox,
  GitCommit,
  Star,
  GitBranch,
  Plus,
  MessageSquare,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectCard } from "@/components/ProjectCard";
import { CommitHeatmap } from "@/components/CommitHeatmap";
import { ProjectDetailPanel } from "@/components/ProjectDetailPanel";
import { useCountUp } from "@/hooks/useCountUp";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGitHubUser, type GitHubRepo } from "@/contexts/GitHubUserContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

function AnimatedStat({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated}</>;
}

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload: {
    action?: string;
    ref?: string;
    ref_type?: string;
    size?: number;
    commits?: { message: string }[];
    pull_request?: { title: string; number: number };
    issue?: { title: string; number: number };
  };
}

function getEventInfo(event: GitHubEvent) {
  const repoName = event.repo.name.split("/")[1] || event.repo.name;
  switch (event.type) {
    case "PushEvent": {
      const count = event.payload.size || event.payload.commits?.length || 0;
      const msg = event.payload.commits?.[0]?.message?.split("\n")[0] || "";
      return {
        icon: GitCommit,
        color: "text-primary",
        description: `Pushed ${count} commit${count !== 1 ? "s" : ""} to ${repoName}`,
        detail: msg,
      };
    }
    case "PullRequestEvent":
      return {
        icon: GitPullRequest,
        color: "text-purple-500",
        description: `${event.payload.action === "opened" ? "Opened" : event.payload.action === "closed" ? "Closed" : "Updated"} PR #${event.payload.pull_request?.number} in ${repoName}`,
        detail: event.payload.pull_request?.title || "",
      };
    case "IssuesEvent":
      return {
        icon: MessageSquare,
        color: "text-green-500",
        description: `${event.payload.action === "opened" ? "Opened" : "Closed"} issue #${event.payload.issue?.number} in ${repoName}`,
        detail: event.payload.issue?.title || "",
      };
    case "CreateEvent":
      return {
        icon: event.payload.ref_type === "branch" ? GitBranch : Plus,
        color: "text-success",
        description: `Created ${event.payload.ref_type}${event.payload.ref ? ` "${event.payload.ref}"` : ""} in ${repoName}`,
        detail: "",
      };
    case "WatchEvent":
      return {
        icon: Star,
        color: "text-warning",
        description: `Starred ${repoName}`,
        detail: "",
      };
    default:
      return {
        icon: GitCommit,
        color: "text-muted-foreground",
        description: `${event.type.replace("Event", "")} in ${repoName}`,
        detail: "",
      };
  }
}

export default function Dashboard() {
  const { user, repos, reposLoading, refreshRepos } = useGitHubUser();
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [openIssues, setOpenIssues] = useState(0);
  const [openPRs, setOpenPRs] = useState(0);
  const [countsLoading, setCountsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const recentRepos = repos.slice(0, 3);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setEventsLoading(true);
    try {
      const token = localStorage.getItem("devhub_github_token");
      const res = await fetch(
        `https://api.github.com/users/${user.login}/events?per_page=10`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error();
      setEvents(await res.json());
    } catch {
      // silent
    } finally {
      setEventsLoading(false);
    }
  }, [user]);

  const fetchCounts = useCallback(async () => {
    if (repos.length === 0) { setOpenIssues(0); setOpenPRs(0); return; }
    setCountsLoading(true);
    const token = localStorage.getItem("devhub_github_token");
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };

    // Search API for open issues & PRs across all user repos
    try {
      const [issuesRes, prsRes] = await Promise.all([
        fetch(`https://api.github.com/search/issues?q=author:${user?.login}+is:issue+is:open&per_page=1`, { headers }),
        fetch(`https://api.github.com/search/issues?q=author:${user?.login}+is:pr+is:open&per_page=1`, { headers }),
      ]);
      if (issuesRes.ok) {
        const d = await issuesRes.json();
        setOpenIssues(d.total_count || 0);
      }
      if (prsRes.ok) {
        const d = await prsRes.json();
        setOpenPRs(d.total_count || 0);
      }
    } catch {
      // silent
    } finally {
      setCountsLoading(false);
    }
  }, [repos.length, user?.login]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshRepos();
    await fetchEvents();
    await fetchCounts();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const stats = [
    { label: "Total Repos", value: repos.length, icon: FolderKanban, color: "text-primary" },
    { label: "Open Issues", value: openIssues, icon: CircleDot, color: "text-success" },
    { label: "Open PRs", value: openPRs, icon: GitPullRequest, color: "text-warning" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
          disabled={refreshing}
          onClick={handleRefresh}
        >
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-3xl font-semibold text-foreground">
              {(reposLoading || countsLoading) ? <Skeleton className="h-9 w-16 inline-block" /> : <AnimatedStat value={s.value} />}
            </p>
          </div>
        ))}
      </div>

      {/* Commit Heatmap */}
      {user && <CommitHeatmap username={user.login} />}

      {/* Quick Access */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Quick Access</h2>
          <Link to="/projects" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            All projects <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {reposLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-md" />
                  <div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-16" /></div>
                </div>
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2"><Skeleton className="h-8 flex-1" /><Skeleton className="h-8 flex-1" /></div>
              </div>
            ))}
          </div>
        ) : recentRepos.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {recentRepos.map((r) => (
              <ProjectCard key={r.id} repo={r} onClick={() => setSelectedRepo(r)} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="No projects yet" subtitle="Connect your GitHub account in Settings to see your repos here" compact />
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
        {eventsLoading ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <Skeleton className="w-4 h-4 rounded-full mt-0.5" />
                <div className="flex-1 space-y-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
            {events.map((event) => {
              const info = getEventInfo(event);
              const ago = formatDistanceToNow(new Date(event.created_at), { addSuffix: true });
              return (
                <div key={event.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-colors animate-fade-in">
                  <info.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${info.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{info.description}</p>
                    {info.detail && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{info.detail}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">{ago}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="No recent activity" subtitle="Your push, PR, and issue events will appear here" compact />
        )}
      </section>

      <ProjectDetailPanel repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
    </div>
  );
}
