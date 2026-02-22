import { useState } from "react";
import {
  FolderKanban,
  GitCommit,
  Activity,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { mockProjects, mockActivities } from "@/data/mockData";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetailPanel } from "@/components/ProjectDetailPanel";
import { Project } from "@/data/types";
import { useCountUp } from "@/hooks/useCountUp";

function AnimatedStat({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated}</>;
}

const stats = [
  {
    label: "Total Projects",
    value: mockProjects.length,
    icon: FolderKanban,
    color: "text-primary",
  },
  {
    label: "Synced",
    value: mockProjects.filter((p) => p.syncStatus === "synced").length,
    icon: GitCommit,
    color: "text-success",
  },
  {
    label: "Pending Changes",
    value: mockProjects.filter((p) => p.syncStatus !== "synced").length,
    icon: Activity,
    color: "text-warning",
  },
];

export default function Dashboard() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const recentProjects = mockProjects.slice(0, 3);

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
        <div className="grid grid-cols-3 gap-4">
          {recentProjects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
           {mockActivities.map((a, i) => (
            <div
              key={a.id}
              className="flex items-center gap-4 px-5 py-3.5 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
            >
              <GitCommit className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{a.message}</p>
                <p className="text-xs text-muted-foreground">
                  {a.project} ·{" "}
                  <span className="font-mono">{a.hash}</span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                <Clock className="h-3 w-3" />
                {a.time}
              </span>
            </div>
          ))}
        </div>
      </section>

      <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
