import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  html_url: string;
  default_branch: string;
  private: boolean;
  open_issues_count: number;
  has_issues: boolean;
}

interface GitHubContextType {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  loading: boolean;
  reposLoading: boolean;
  reposError: string;
  fetchUser: (token: string) => Promise<{ success: boolean; error?: string }>;
  clearUser: () => void;
  refreshRepos: () => void;
}

const GitHubUserContext = createContext<GitHubContextType | null>(null);

export function GitHubUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState("");

  const fetchRepos = useCallback(async (token: string) => {
    setReposLoading(true);
    setReposError("");
    try {
      const res = await fetch("https://api.github.com/user/repos?sort=pushed&per_page=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data: GitHubRepo[] = await res.json();
      setRepos(data);
    } catch {
      setReposError("Could not connect to GitHub. Check your token in Settings.");
    } finally {
      setReposLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async (token: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setUser(null);
        localStorage.removeItem("devhub_github_token");
        return { success: false, error: "Invalid token" };
      }
      const data = await res.json();
      setUser({ login: data.login, avatar_url: data.avatar_url });
      localStorage.setItem("devhub_github_token", token);
      fetchRepos(token);
      return { success: true };
    } catch {
      setUser(null);
      localStorage.removeItem("devhub_github_token");
      return { success: false, error: "Network error" };
    } finally {
      setLoading(false);
    }
  }, [fetchRepos]);

  const clearUser = useCallback(() => {
    setUser(null);
    setRepos([]);
    localStorage.removeItem("devhub_github_token");
  }, []);

  const refreshRepos = useCallback(() => {
    const token = localStorage.getItem("devhub_github_token");
    if (token) fetchRepos(token);
  }, [fetchRepos]);

  // Restore on mount
  useEffect(() => {
    const saved = localStorage.getItem("devhub_github_token");
    if (saved) {
      fetchUser(saved);
    }
  }, [fetchUser]);

  return (
    <GitHubUserContext.Provider value={{ user, repos, loading, reposLoading, reposError, fetchUser, clearUser, refreshRepos }}>
      {children}
    </GitHubUserContext.Provider>
  );
}

export function useGitHubUser() {
  const ctx = useContext(GitHubUserContext);
  if (!ctx) throw new Error("useGitHubUser must be used within GitHubUserProvider");
  return ctx;
}
