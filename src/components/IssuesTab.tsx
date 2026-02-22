import { useState, useEffect, useCallback } from "react";
import { Plus, CircleDot, CircleCheck, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface GitHubLabel {
  id: number;
  name: string;
  color: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  user: { login: string };
  created_at: string;
  labels: GitHubLabel[];
  pull_request?: unknown;
}

interface IssuesTabProps {
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

export function IssuesTab({ owner, repo }: IssuesTabProps) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<"open" | "closed">("open");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [closingId, setClosingId] = useState<number | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=${stateFilter}&per_page=20`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch issues");
      const data: GitHubIssue[] = await res.json();
      // Filter out pull requests (GitHub API returns PRs as issues)
      setIssues(data.filter((i) => !i.pull_request));
    } catch {
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [owner, repo, stateFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ title: title.trim(), body: body.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create issue");
      }
      toast.success("Issue created successfully");
      setTitle("");
      setBody("");
      setShowForm(false);
      setStateFilter("open");
      fetchIssues();
    } catch (e: any) {
      toast.error(e.message || "Failed to create issue");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (issueNumber: number) => {
    setClosingId(issueNumber);
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ state: "closed" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to close issue");
      }
      toast.success(`Issue #${issueNumber} closed`);
      fetchIssues();
    } catch (e: any) {
      toast.error(e.message || "Failed to close issue");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter + New Issue */}
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
        <Button size="sm" className="gap-1.5 text-xs h-7" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? "Cancel" : "New Issue"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-secondary/50 rounded-lg p-3 space-y-2 animate-fade-in">
          <Input
            placeholder="Issue title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 text-sm"
          />
          <Textarea
            placeholder="Description (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
          />
          <Button size="sm" className="text-xs h-7 gap-1.5" disabled={!title.trim() || creating} onClick={handleCreate}>
            {creating && <Loader2 className="h-3 w-3 animate-spin" />}
            Create Issue
          </Button>
        </div>
      )}

      {/* Issues list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="w-4 h-4 rounded-full mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No {stateFilter} issues</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {issues.map((issue) => (
            <div key={issue.id} className="flex items-start gap-3 p-3 hover:bg-surface-hover transition-colors">
              {issue.state === "open" ? (
                <CircleDot className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <CircleCheck className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {issue.title}
                  <span className="text-muted-foreground font-normal ml-1.5">#{issue.number}</span>
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {issue.labels.map((label) => (
                    <Badge
                      key={label.id}
                      className="text-[10px] px-1.5 py-0 h-4 border-0 font-medium"
                      style={{
                        backgroundColor: `#${label.color}20`,
                        color: `#${label.color}`,
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  opened by {issue.user.login} {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                </p>
              </div>
              {issue.state === "open" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive flex-shrink-0"
                  disabled={closingId === issue.number}
                  onClick={() => handleClose(issue.number)}
                >
                  {closingId === issue.number ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Close"
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
