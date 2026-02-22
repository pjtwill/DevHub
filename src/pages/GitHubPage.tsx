import { useState, useEffect } from "react";
import { getLanguageConfig } from "@/lib/languages";
import { Star, Link as LinkIcon, ExternalLink, Github, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useGitHubUser } from "@/contexts/GitHubUserContext";

function RepoSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-72" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

export default function GitHubPage() {
  const navigate = useNavigate();
  const { repos, reposLoading, reposError } = useGitHubUser();

  const token = localStorage.getItem("devhub_github_token");

  if (!token) {
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

      {reposError && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{reposError}</span>
          <Button size="sm" variant="outline" className="ml-auto text-xs" onClick={() => navigate("/settings")}>
            Go to Settings
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {reposLoading
          ? Array.from({ length: 6 }).map((_, i) => <RepoSkeleton key={i} />)
          : repos.map((repo, index) => {
              const lang = repo.language ? getLanguageConfig(repo.language) : null;
              return (
                <div
                  key={repo.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-foreground">{repo.full_name}</h3>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mb-2 truncate max-w-lg">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {lang && (
                        <span className="flex items-center gap-1">
                          <span style={{ color: lang.color }}>{lang.icon}</span>
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {repo.stargazers_count}
                      </span>
                      <span>
                        Updated {formatDistanceToNow(new Date(repo.pushed_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => toast.success(`Linked ${repo.name} to a project`)}
                    >
                      <LinkIcon className="h-3 w-3" />
                      Link
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 gap-1.5 text-muted-foreground"
                      onClick={() => window.open(repo.html_url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
        {!reposLoading && !reposError && repos.length === 0 && (
          <div className="px-5 py-12">
            <EmptyState
              icon={Github}
              title="No repositories found"
              subtitle="Your GitHub account doesn't have any repositories yet"
            />
          </div>
        )}
      </div>
    </div>
  );
}
