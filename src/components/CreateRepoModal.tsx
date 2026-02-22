import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGitHubUser, type GitHubRepo } from "@/contexts/GitHubUserContext";

interface CreateRepoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (repo: GitHubRepo) => void;
}

export function CreateRepoModal({ open, onClose, onCreated }: CreateRepoModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refreshRepos } = useGitHubUser();

  const handleCreate = async () => {
    const token = localStorage.getItem("devhub_github_token");
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          private: isPrivate,
          auto_init: autoInit,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(err.message || "Failed to create repository");
      }

      const created: GitHubRepo = await res.json();
      toast.success("Repository created successfully", { description: created.full_name });
      refreshRepos();
      onClose();
      setName("");
      setDescription("");
      setIsPrivate(false);
      setAutoInit(true);
      onCreated?.(created);
    } catch (e: any) {
      toast.error("Failed to create repository", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Repository</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="new-repo-name" className="text-xs text-muted-foreground">Repository Name *</Label>
            <Input
              id="new-repo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border font-mono text-sm"
              placeholder="my-awesome-project"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-repo-desc" className="text-xs text-muted-foreground">Description</Label>
            <Input
              id="new-repo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border text-sm"
              placeholder="Short description..."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-sm text-foreground">Visibility</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPrivate ? "Only you can see this repo" : "Anyone can see this repo"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{isPrivate ? "Private" : "Public"}</span>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Checkbox
              id="auto-init"
              checked={autoInit}
              onCheckedChange={(v) => setAutoInit(v === true)}
            />
            <div>
              <Label htmlFor="auto-init" className="text-sm text-foreground cursor-pointer">Initialize with README</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Creates an initial commit with a README.md file</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
            Create Repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
