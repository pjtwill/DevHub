import { useState } from "react";
import { mockRepos } from "@/data/mockData";
import { getLanguageConfig } from "@/lib/languages";
import { Star, Link as LinkIcon, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function GitHubPage() {
  const navigate = useNavigate();
  // Toggle this to preview empty state: set to true
  const [connected] = useState(true);

  if (!connected) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-lg font-semibold text-foreground">GitHub Repositories</h1>
        <EmptyState
          icon={Github}
          title="Connect your GitHub account"
          subtitle="Paste your Personal Access Token in Settings to see your repositories"
          actions={[
            { label: "Go to Settings", onClick: () => navigate("/settings") },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-lg font-semibold text-foreground">GitHub Repositories</h1>

      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {mockRepos.map((repo) => {
          const lang = getLanguageConfig(repo.language);
          return (
            <div
              key={repo.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors animate-fade-in"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-foreground">{repo.fullName}</h3>
                  {repo.isLinked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      Linked
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{repo.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span style={{ color: lang.color }}>{lang.icon}</span>
                    {repo.language}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {repo.stars}
                  </span>
                  <span>Updated {repo.updatedAt}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                {!repo.isLinked && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 gap-1.5"
                    onClick={() => toast.success(`Linked ${repo.name} to a project`)}
                  >
                    <LinkIcon className="h-3 w-3" />
                    Link
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 gap-1.5 text-muted-foreground"
                  onClick={() => window.open(`https://github.com/${repo.fullName}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
