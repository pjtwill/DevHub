import { useState, useEffect } from "react";
import { X, GitBranch, FolderOpen, ArrowUpDown, ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type GitHubRepo } from "@/contexts/GitHubUserContext";
import { getLanguageConfig } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { EditRepoModal } from "@/components/EditRepoModal";
import { DeleteRepoModal } from "@/components/DeleteRepoModal";
import { IssuesTab } from "@/components/IssuesTab";

interface ProjectDetailPanelProps {
  repo: GitHubRepo | null;
  onClose: () => void;
}

export function ProjectDetailPanel({ repo, onClose }: ProjectDetailPanelProps) {
  const [closing, setClosing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (repo) {
      setClosing(false);
      setEditOpen(false);
    }
  }, [repo?.id]);

  if (!repo) return null;

  const lang = getLanguageConfig(repo.language || "");
  const pushedAgo = formatDistanceToNow(new Date(repo.pushed_at), { addSuffix: true });

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-200",
          closing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[480px] bg-card border-l border-border z-50 flex flex-col",
          closing ? "animate-slide-out-right" : "animate-slide-in-right"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: `${lang.color}15`, color: lang.color }}
            >
              {lang.icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">{repo.name}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                {repo.language && <span>{repo.language}</span>}
                {repo.language && <span>·</span>}
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {repo.default_branch}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {repo.stargazers_count}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Edit repository</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs h-8 bg-info hover:bg-info/80 text-info-foreground"
                  onClick={() => toast.success("Opening in VS Code...", { description: repo.name })}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Open in VS Code
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Open in your local editor</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => toast.info("Syncing with remote...")}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Push / Pull
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Sync with remote</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                  <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-8 text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                    GitHub
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Open on GitHub</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 pt-3">
            <TabsList className="h-8 w-full">
              <TabsTrigger value="overview" className="text-xs flex-1">Overview</TabsTrigger>
              <TabsTrigger value="issues" className="text-xs flex-1">Issues</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 overflow-y-auto px-5 pb-5 mt-0">
            <div className="space-y-5 pt-3">
              {repo.description && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</h3>
                  <p className="text-sm text-foreground">{repo.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <h3 className="text-xs text-muted-foreground mb-1">Default Branch</h3>
                  <p className="text-sm font-mono text-foreground flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-primary/70" />
                    {repo.default_branch}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <h3 className="text-xs text-muted-foreground mb-1">Last Pushed</h3>
                  <p className="text-sm text-foreground">Updated {pushedAgo}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <h3 className="text-xs text-muted-foreground mb-1">Stars</h3>
                  <p className="text-sm text-foreground flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-warning" />
                    {repo.stargazers_count}
                  </p>
                </div>
                {repo.language && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <h3 className="text-xs text-muted-foreground mb-1">Language</h3>
                    <p className="text-sm text-foreground flex items-center gap-1.5">
                      <span style={{ color: lang.color }}>{lang.icon}</span>
                      {repo.language}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="flex-1 overflow-y-auto px-5 pb-5 mt-0">
            <div className="pt-3">
              <IssuesTab owner={repo.full_name.split("/")[0]} repo={repo.name} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono truncate">
            {repo.full_name}
          </p>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5 text-xs h-8"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <EditRepoModal repo={repo} open={editOpen} onClose={() => setEditOpen(false)} />
      )}

      {/* Delete Modal */}
      {deleteOpen && (
        <DeleteRepoModal
          repo={repo}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            handleClose();
          }}
        />
      )}
    </>
  );
}
