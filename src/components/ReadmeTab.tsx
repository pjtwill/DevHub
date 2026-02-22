import { useState, useEffect, useCallback } from "react";
import { Pencil, Save, X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReadmeTabProps {
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

export function ReadmeTab({ owner, repo }: ReadmeTabProps) {
  const [content, setContent] = useState("");
  const [sha, setSha] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReadme = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers: getHeaders() }
      );
      if (res.status === 404) {
        setNotFound(true);
        setContent("");
        setSha("");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch README");
      const data = await res.json();
      const decoded = atob(data.content.replace(/\n/g, ""));
      setContent(decoded);
      setSha(data.sha);
    } catch {
      toast.error("Failed to load README");
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    fetchReadme();
  }, [fetchReadme]);

  const handleEdit = () => {
    setDraft(content);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const encoded = btoa(unescape(encodeURIComponent(draft)));
      const body: Record<string, string> = {
        message: "docs: update README",
        content: encoded,
      };
      if (sha) body.sha = sha;

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
        { method: "PUT", headers: getHeaders(), body: JSON.stringify(body) }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update README");
      }
      const data = await res.json();
      setContent(draft);
      setSha(data.content.sha);
      setEditing(false);
      toast.success("README updated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to update README");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <FileText className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm mb-3">No README found</p>
        <Button size="sm" className="text-xs h-7 gap-1.5" onClick={handleEdit}>
          <Pencil className="h-3 w-3" />
          Create README
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        {editing ? (
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" className="text-xs h-7 gap-1.5" onClick={handleCancel} disabled={saving}>
              <X className="h-3 w-3" />
              Cancel
            </Button>
            <Button size="sm" className="text-xs h-7 gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1.5" onClick={handleEdit}>
            <Pencil className="h-3 w-3" />
            Edit README
          </Button>
        )}
      </div>

      {editing ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[300px] font-mono text-sm resize-none"
          placeholder="Write your README in Markdown..."
        />
      ) : (
        <div className="readme-content prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
