import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useGitHubUser, type GitHubRepo } from "@/contexts/GitHubUserContext";

interface DeleteRepoModalProps {
  repo: GitHubRepo;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteRepoModal({ repo, open, onClose, onDeleted }: DeleteRepoModalProps) {
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { refreshRepos } = useGitHubUser();

  const nameMatches = confirmName === repo.name;

  const handleDelete = async () => {
    if (!nameMatches) return;
    const token = localStorage.getItem("devhub_github_token");
    if (!token) return;

    setDeleting(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${repo.full_name}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(err.message || "Failed to delete repository");
      }

      toast.success("Repository deleted successfully", { description: repo.full_name });
      refreshRepos();
      onClose();
      onDeleted?.();
    } catch (e: any) {
      toast.error("Failed to delete repository", { description: e.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Repository
          </DialogTitle>
          <DialogDescription>
            This action <strong>cannot</strong> be undone. This will permanently delete the
            <strong className="font-mono"> {repo.full_name} </strong>
            repository and all of its contents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="confirm-name" className="text-xs text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">{repo.name}</span> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="bg-secondary border-border font-mono text-sm"
              placeholder={repo.name}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !nameMatches}
          >
            {deleting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
            Delete this repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
