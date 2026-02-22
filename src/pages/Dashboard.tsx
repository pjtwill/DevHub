import {
  FolderKanban,
  GitCommit,
  Activity,
  Clock,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectCard } from "@/components/ProjectCard";
import { useCountUp } from "@/hooks/useCountUp";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useGitHubUser } from "@/contexts/GitHubUserContext";

function AnimatedStat({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated}</>;
}

export default function Dashboard() {
  const { repos, reposLoading } = useGitHubUser();
  const recentRepos = repos.slice(0, 3);

  const stats = [
    {
      label: "Total Projects",
      value: repos.length,
      icon: FolderKanban,
      color: "text-primary",
    },
    {
      label: "Languages",
      value: new Set(repos.map((r) => r.language).filter(Boolean)).size,
      icon: Activity,
      color: "text-success",
    },
    {
      label: "Total Stars",
      value: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
      icon: GitCommit,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-lg p-5 animate-fade-in"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {s.label}
              </span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-3xl font-semibold text-foreground">
              <AnimatedStat value={s.value} />
            </p>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Quick Access</h2>
          <Link
            to="/projects"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            All projects <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {reposLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : recentRepos.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {recentRepos.map((r) => (
              <ProjectCard key={r.id} repo={r} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title="No projects yet"
            subtitle="Connect your GitHub account in Settings to see your repos here"
            compact
          />
        )}
      </section>

      {/* Recent Activity - placeholder */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <EmptyState
          icon={Inbox}
          title="No recent activity"
          subtitle="Commits and sync events will appear here"
          compact
        />
      </section>
    </div>
  );
}
