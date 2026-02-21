import { useState } from "react";
import { mockProjects } from "@/data/mockData";
import { ProjectCard } from "@/components/ProjectCard";
import { SyncStatus } from "@/data/types";

const languages = ["All", "React", "Node", "Python"];
const statuses: { label: string; value: SyncStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Synced", value: "synced" },
  { label: "Uncommitted", value: "uncommitted" },
  { label: "Behind", value: "behind" },
];

export default function Projects() {
  const [langFilter, setLangFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<SyncStatus | "all">("all");

  const filtered = mockProjects.filter((p) => {
    if (langFilter !== "All" && p.language !== langFilter) return false;
    if (statusFilter !== "all" && p.syncStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Projects</h1>
        <div className="flex gap-2">
          {/* Language filter */}
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
          {/* Status filter */}
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
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <span className="text-2xl">📂</span>
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">No projects found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
