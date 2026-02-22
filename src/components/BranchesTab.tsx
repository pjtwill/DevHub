import { useState, useEffect, useCallback } from "react";
import { GitBranch, Plus, Trash2, X, Loader2, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface BranchCommit {
  sha: string;
  commit: {
    message: string;
    committer: { date: string };
  };
}

interface GitHubBranch {
  name: string;
  commit: BranchCommit["commit"] & { sha: string };
  protected: boolean;
}

interface ApiBranch {
  name: string;
  commit: { sha: string; url: string };
  protected: boolean;
}

interface BranchesTabProps {
  owner: string;
  repo: string;
  defaultBranch: string;
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

export function BranchesTab({ owner, repo, defaultBranch }: BranchesTabProps) {
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [sourceBranch, setSourceBranch] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch branches");
      const data: ApiBranch[] = await res.json();

      // Fetch commit details for each branch (batch first 30)
      const detailed = await Promise.all(
        data.slice(0, 30).map(async (b) => {
          try {
            const cRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/commits/${b.commit.sha}`,
              { headers: getHeaders() }
            );
            if (!cRes.ok) throw new Error();
            const c: BranchCommit = await cRes.json();
            return {
              name: b.name,
              commit: { sha: b.commit.sha, message: c.commit.message, committer: c.commit.committer },
              protected: b.protected,
            } as GitHubBranch;
          } catch {
            return {
              name: b.name,
              commit: { sha: b.commit.sha, message: "", committer: { date: new Date().toISOString() } },
              protected: b.protected,
            } as GitHubBranch;
          }
        })
      );

      // Sort default branch first
      detailed.sort((a, b) => {
        if (a.name === defaultBranch) return -1;
        if (b.name === defaultBranch) return 1;
        return 0;
      });

      setBranches(detailed);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [owner, repo, defaultBranch]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleCreate = async () => {
    if (!newName.trim() || !sourceBranch) return;
    const source = branches.find((b) => b.name === sourceBranch);
    if (!source) return;

    setCreating(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ ref: `refs/heads/${newName.trim()}`, sha: source.commit.sha }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create branch");
      }
      toast.success(`Branch "${newName.trim()}" created`);
      setNewName("");
      setSourceBranch("");
      setShowForm(false);
      fetchBranches();
    } catch (e: any) {
      toast.error(e.message || "Failed to create branch");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (branchName: string) => {
    setDeletingBranch(branchName);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
        { method: "DELETE", headers: getHeaders() }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete branch");
      }
      toast.success(`Branch "${branchName}" deleted`);
      fetchBranches();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete branch");
    } finally {
      setDeletingBranch(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{branches.length} branches</p>
        <Button size="sm" className="gap-1.5 text-xs h-7" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? "Cancel" : "New Branch"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-secondary/50 rounded-lg p-3 space-y-2 animate-fade-in">
          <Input
            placeholder="Branch name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 text-sm"
          />
          <Select value={sourceBranch} onValueChange={setSourceBranch}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Branch from..." />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.name} value={b.name}>
                  {b.name} {b.name === defaultBranch ? "(default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="text-xs h-7 gap-1.5"
            disabled={!newName.trim() || !sourceBranch || creating}
            onClick={handleCreate}
          >
            {creating && <Loader2 className="h-3 w-3 animate-spin" />}
            Create Branch
          </Button>
        </div>
      )}

      {/* Branches list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-4 h-4 rounded mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No branches found</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {branches.map((branch) => {
            const isDefault = branch.name === defaultBranch;
            const ago = branch.commit.committer?.date
              ? formatDistanceToNow(new Date(branch.commit.committer.date), { addSuffix: true })
              : "";
            const shortSha = branch.commit.sha.slice(0, 7);

            return (
              <div
                key={branch.name}
                className="flex items-start gap-3 p-3 hover:bg-surface-hover transition-colors"
              >
                <GitBranch className={cn("h-4 w-4 mt-0.5 flex-shrink-0", isDefault ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium font-mono text-foreground truncate">{branch.name}</p>
                    {isDefault && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                        default
                      </Badge>
                    )}
                    {branch.protected && (
                      <Shield className="h-3 w-3 text-warning flex-shrink-0" />
                    )}
                  </div>
                  {branch.commit.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{branch.commit.message.split("\n")[0]}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{shortSha}</span>
                    {ago && <span> · {ago}</span>}
                  </p>
                </div>
                {!isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                    disabled={deletingBranch === branch.name}
                    onClick={() => setConfirmDelete(branch.name)}
                  >
                    {deletingBranch === branch.name ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the branch <span className="font-mono font-semibold">{confirmDelete}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={deletingBranch !== null}
            >
              {deletingBranch !== null ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
