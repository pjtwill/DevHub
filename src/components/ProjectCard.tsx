import { GitBranch, ExternalLink, FolderOpen, ArrowUpDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GitHubRepo } from "@/contexts/GitHubUserContext";
import { getLanguageConfig } from "@/lib/languages";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  repo: GitHubRepo;
  onClick?: () => void;
}

export function ProjectCard({ repo, onClick }: ProjectCardProps) {
  const lang = getLanguageConfig(repo.language || "");
  const pushedAgo = formatDistanceToNow(new Date(repo.pushed_at), { addSuffix: true });

  return (
    <div
      className="group bg-card border border-border rounded-lg p-5 transition-all duration-200 ease-out hover:border-primary/30 hover:bg-surface-hover hover:scale-[1.02] animate-fade-in cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: `${lang.color}15`, color: lang.color }}
          >
            {lang.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{repo.name}</h3>
            {repo.language && (
              <span className="text-xs text-muted-foreground">{repo.language}</span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{repo.description}</p>
      )}

      {/* GitHub link */}
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
      >
        <ExternalLink className="h-3 w-3" />
        <span className="font-mono truncate">{repo.full_name}</span>
      </a>

      {/* Branch */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          {repo.default_branch}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="flex-1 gap-1.5 text-xs h-8 bg-info hover:bg-info/80 text-info-foreground"
                onClick={() => toast.success("Opening in VS Code...", { description: repo.name })}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Open in VS Code
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Open project in VS Code</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 text-xs h-8"
                onClick={() => toast.info("Syncing with remote...")}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Push / Pull
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Sync with remote repository</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Last pushed */}
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Updated {pushedAgo}</span>
      </div>
    </div>
  );
}
