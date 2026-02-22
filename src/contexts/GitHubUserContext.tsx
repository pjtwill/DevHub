import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface GitHubUser {
  login: string;
  avatar_url: string;
}

interface GitHubUserContextType {
  user: GitHubUser | null;
  loading: boolean;
  fetchUser: (token: string) => Promise<{ success: boolean; error?: string }>;
  clearUser: () => void;
}

const GitHubUserContext = createContext<GitHubUserContextType | null>(null);

export function GitHubUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async (token: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setUser(null);
        return { success: false, error: "Invalid token" };
      }
      const data = await res.json();
      setUser({ login: data.login, avatar_url: data.avatar_url });
      localStorage.setItem("devhub_github_token", token);
      return { success: true };
    } catch {
      setUser(null);
      return { success: false, error: "Network error" };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem("devhub_github_token");
  }, []);

  // Restore on mount
  useEffect(() => {
    const saved = localStorage.getItem("devhub_github_token");
    if (saved) {
      fetchUser(saved);
    }
  }, [fetchUser]);

  return (
    <GitHubUserContext.Provider value={{ user, loading, fetchUser, clearUser }}>
      {children}
    </GitHubUserContext.Provider>
  );
}

export function useGitHubUser() {
  const ctx = useContext(GitHubUserContext);
  if (!ctx) throw new Error("useGitHubUser must be used within GitHubUserProvider");
  return ctx;
}
