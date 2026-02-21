import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  FolderOpen,
  ExternalLink,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/data/mockData";
import { getProjectCommits, getProjectBranches, getProjectFileTree } from "@/data/projectDetailData";
import { getLanguageConfig } from "@/lib/languages";
import { FileTreeNode } from "@/data/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  synced: { label: "Synced", className: "bg-success" },
  uncommitted: { label: "Uncommitted", className: "bg-warning" },
  behind: { label: "Behind", className: "bg-destructive" },
};

function FileTreeItem({ node, depth = 0 }: { node: FileTreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const isFolder = node.type === "folder";

  return (
    <div>
      <button
        onClick={() => isFolder && setOpen(!open)}
        className={cn(
          "flex items-center gap-2 w-full text-left py-1.5 px-2 rounded text-sm transition-colors hover:bg-surface-hover",
          isFolder ? "text-foreground cursor-pointer" : "text-muted-foreground cursor-default"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isFolder ? (
          open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <span className="w-3.5" />
        )}
        {isFolder ? (
          <Folder className="h-4 w-4 text-primary/70 flex-shrink-0" />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
        )}
        <span className={cn("truncate", isFolder ? "font-medium text-xs" : "text-xs font-mono")}>{node.name}</span>
      </button>
      {isFolder && open && node.children?.map((child) => (
        <FileTreeItem key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button variant="outline" onClick={() => navigate("/projects")}>Back to Projects</Button>
      </div>
    );
  }

  const lang = getLanguageConfig(project.language);
  const status = statusConfig[project.syncStatus];
  const commits = getProjectCommits(project.id);
  const branches = getProjectBranches(project.id);
  const fileTree = getProjectFileTree(project.id);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: `${lang.color}15`, color: lang.color }}
          >
            {lang.icon}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{project.language}</span>
              <span>·</span>
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <ExternalLink className="h-3 w-3" />
                {project.githubUrl.replace("https://github.com/", "")}
              </a>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <FolderOpen className="h-3 w-3" />
                {project.localPath}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full animate-pulse-dot", status.className)} />
            <span className="text-sm text-muted-foreground">{status.label}</span>
          </div>
          <Button size="sm" className="gap-1.5 bg-info hover:bg-info/80 text-info-foreground" onClick={() => toast.success("Opening in VS Code...", { description: project.localPath })}>
            <FolderOpen className="h-4 w-4" />
            Open in VS Code
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("Syncing with remote...")}>
            <ArrowUpDown className="h-4 w-4" />
            Push / Pull
          </Button>
        </div>
      </div>

      {/* Three columns: Commits, Branches, File Tree */}
      <div className="grid grid-cols-3 gap-4">
        {/* Commit History */}
        <div className="col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
            <GitCommit className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Commit History</h2>
            <span className="text-xs text-muted-foreground ml-auto">{commits.length} commits</span>
          </div>
          <div className="divide-y divide-border">
            {commits.map((c) => (
              <div key={c.hash} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-hover transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary/50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{c.message}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{c.hash}</span>
                    <span>·</span>
                    <span>{c.author}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{c.branch}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{c.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Branches + File Tree */}
        <div className="space-y-4">
          {/* Branches */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
              <GitBranch className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Branches</h2>
              <span className="text-xs text-muted-foreground ml-auto">{branches.length}</span>
            </div>
            <div className="divide-y divide-border">
              {branches.map((b) => (
                <div key={b.name} className="px-5 py-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-mono">{b.name}</span>
                    {b.isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">default</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">{b.lastCommit}</span>
                    <span>·</span>
                    <span>{b.aheadBehind}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Tree */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
              <FolderOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Files</h2>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {fileTree.map((node) => (
                <FileTreeItem key={node.name} node={node} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
