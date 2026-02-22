import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Github, FolderOpen, Terminal, Loader2 } from "lucide-react";
import { useGitHubUser } from "@/contexts/GitHubUserContext";

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [vscodePath, setVscodePath] = useState("code");
  const [projectsFolder, setProjectsFolder] = useState("~/projects");
  const [tokenError, setTokenError] = useState("");
  const { fetchUser, loading } = useGitHubUser();

  const handleSaveToken = async () => {
    setTokenError("");
    const result = await fetchUser(token);
    if (result.success) {
      toast.success("GitHub token saved");
      setToken("");
    } else {
      setTokenError(result.error || "Invalid token");
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-lg font-semibold text-foreground">Settings</h1>

      {/* GitHub Token */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Github className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">GitHub Connection</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="token" className="text-xs text-muted-foreground">
            Personal Access Token
          </Label>
          <Input
            id="token"
            type="password"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setTokenError("");
            }}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className={`bg-secondary border-border font-mono text-sm ${tokenError ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {tokenError ? (
            <p className="text-xs text-destructive font-medium">{tokenError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Generate a token at GitHub → Settings → Developer settings → Personal access tokens
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleSaveToken}
          disabled={!token || loading}
        >
          {loading && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
          Save Token
        </Button>
      </section>

      {/* VS Code Path */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">VS Code</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vscode" className="text-xs text-muted-foreground">
            VS Code Command Path
          </Label>
          <Input
            id="vscode"
            value={vscodePath}
            onChange={(e) => setVscodePath(e.target.value)}
            className="bg-secondary border-border font-mono text-sm"
          />
        </div>
      </section>

      {/* Default Folder */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Default Projects Folder</h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="folder" className="text-xs text-muted-foreground">
            Path
          </Label>
          <Input
            id="folder"
            value={projectsFolder}
            onChange={(e) => setProjectsFolder(e.target.value)}
            className="bg-secondary border-border font-mono text-sm"
          />
        </div>
      </section>
    </div>
  );
}
