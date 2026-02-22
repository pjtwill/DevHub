import { useState, useEffect, useCallback } from "react";
import { GitPullRequest, GitMerge, CircleDot, CircleCheck, CircleX, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  user: { login: string };
  created_at: string;
  head: { ref: string };
  base: { ref: string };
  labels: { id: number; name: string; color: string }[];
}

interface PullRequestsTabProps {
  owner: string;
  repo: string;
}

function getHeaders() {
  const token = localStorage.getItem("devhub_github_token");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

type FilterState = "open" | "closed";

function getPRStatus(pr: GitHubPR): "open" | "merged" | "closed" {
  if (pr.merged_at) return "merged";
  return pr.state;
}

function PRStatusBadge({ status }: { status: "open" | "merged" | "closed" }) {
  const config = {
    open: { label: "Open", className: "bg-green-500/15 text-green-500 border-green-500/20" },
    merged: { label: "Merged", className: "bg-purple-500/15 text-purple-500 border-purple-500/20" },
    closed: { label: "Closed", className: "bg-destructive/15 text-destructive border-destructive/20" },
  }[status];

  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

function PRIcon({ status }: { status: "open" | "merged" | "closed" }) {
  if (status === "merged") return <GitMerge className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />;
  if (status === "closed") return <CircleX className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />;
  return <GitPullRequest className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />;
}

export function PullRequestsTab({ owner, repo }: PullRequestsTabProps) {
  const [prs, setPrs] = useState<GitHubPR[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<FilterState>("open");
  const [mergingPR, setMergingPR] = useState<number | null>(null);
  const [closingPR, setClosingPR] = useState<number | null>(null);
  const [confirmMerge, setConfirmMerge] = useState<GitHubPR | null>(null);

  const fetchPRs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=${stateFilter}&per_page=20`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch pull requests");
      const data: GitHubPR[] = await res.json();
      setPrs(data);
    } catch {
      toast.error("Failed to load pull requests");
    } finally {
      setLoading(false);
    }
  }, [owner, repo, stateFilter]);

  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  const handleMerge = async (pr: GitHubPR) => {
    setMergingPR(pr.number);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/merge`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ merge_method: "merge" }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to merge pull request");
      }
      toast.success(`PR #${pr.number} merged successfully`);
      fetchPRs();
    } catch (e: any) {
      toast.error(e.message || "Failed to merge pull request");
    } finally {
      setMergingPR(null);
      setConfirmMerge(null);
    }
  };

  const handleClose = async (prNumber: number) => {
    setClosingPR(prNumber);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ state: "closed" }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to close pull request");
      }
      toast.success(`PR #${prNumber} closed`);
      fetchPRs();
    } catch (e: any) {
      toast.error(e.message || "Failed to close pull request");
    } finally {
      setClosingPR(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex bg-secondary rounded-md p-0.5">
          <button
            onClick={() => setStateFilter("open")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors",
              stateFilter === "open"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CircleDot className="h-3 w-3" />
            Open
          </button>
          <button
            onClick={() => setStateFilter("closed")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors",
              stateFilter === "closed"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CircleCheck className="h-3 w-3" />
            Closed
          </button>
        </div>
      </div>

      {/* PR list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="w-4 h-4 rounded-full mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : prs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No {stateFilter} pull requests</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {prs.map((pr) => {
            const status = getPRStatus(pr);
            return (
              <div key={pr.id} className="flex items-start gap-3 p-3 hover:bg-surface-hover transition-colors">
                <PRIcon status={status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug truncate">
                      {pr.title}
                      <span className="text-muted-foreground font-normal ml-1.5">#{pr.number}</span>
                    </p>
                    <PRStatusBadge status={status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono">
                    <span className="truncate max-w-[100px]">{pr.head.ref}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
                    <span className="truncate max-w-[100px]">{pr.base.ref}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {pr.user.login} {formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}
                  </p>
                </div>
                {status === "open" && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      className="text-xs h-7 px-2 gap-1"
                      disabled={mergingPR === pr.number}
                      onClick={() => setConfirmMerge(pr)}
                    >
                      {mergingPR === pr.number ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <GitMerge className="h-3 w-3" />
                      )}
                      Merge
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
                      disabled={closingPR === pr.number}
                      onClick={() => handleClose(pr.number)}
                    >
                      {closingPR === pr.number ? <Loader2 className="h-3 w-3 animate-spin" /> : "Close"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Merge confirmation */}
      <AlertDialog open={!!confirmMerge} onOpenChange={(open) => !open && setConfirmMerge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Pull Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to merge this PR? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmMerge && handleMerge(confirmMerge)}
              disabled={mergingPR !== null}
            >
              {mergingPR !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
