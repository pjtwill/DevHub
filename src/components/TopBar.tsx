import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Plus, Github, Command, Bell,
  GitPullRequest, CircleDot, MessageSquare, GitCommit, CheckCheck, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useGitHubUser } from "@/contexts/GitHubUserContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TopBarProps {
  onAddProject?: () => void;
  onOpenCommand?: () => void;
}

interface GitHubNotification {
  id: string;
  unread: boolean;
  reason: string;
  subject: { title: string; type: string };
  repository: { full_name: string; name: string };
  updated_at: string;
}

function getNotifIcon(type: string) {
  switch (type) {
    case "PullRequest": return GitPullRequest;
    case "Issue": return CircleDot;
    case "Commit": return GitCommit;
    default: return MessageSquare;
  }
}

function getNotifColor(type: string) {
  switch (type) {
    case "PullRequest": return "text-purple-500";
    case "Issue": return "text-green-500";
    case "Commit": return "text-primary";
    default: return "text-warning";
  }
}

export function TopBar({ onAddProject, onOpenCommand }: TopBarProps) {
  const { user } = useGitHubUser();
  const [notifications, setNotifications] = useState<GitHubNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("devhub_github_token");
    if (!token) return;
    try {
      const res = await fetch("https://api.github.com/notifications?per_page=20", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      if (!res.ok) return;
      setNotifications(await res.json());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = async () => {
    setMarkingRead(true);
    const token = localStorage.getItem("devhub_github_token");
    try {
      const res = await fetch("https://api.github.com/notifications", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ last_read_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-20 mt-[2px]">
      <button
        onClick={onOpenCommand}
        className="relative w-72 flex items-center gap-2 h-9 px-3 rounded-md bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_hsl(239_84%_67%/0.15)]"
      >
        <Search className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">Search or jump to...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
            className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold animate-scale-in">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-[380px] bg-card border border-border rounded-lg shadow-xl animate-scale-in overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                    disabled={markingRead}
                    onClick={markAllRead}
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Inbox className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs mt-0.5">No new notifications</p>
                  </div>
                ) : unreadCount === 0 && notifications.every((n) => !n.unread) ? (
                  <div className="divide-y divide-border">
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Inbox className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm font-medium">All caught up!</p>
                      <p className="text-xs mt-0.5">You've read all notifications</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((n) => {
                      const Icon = getNotifIcon(n.subject.type);
                      const color = getNotifColor(n.subject.type);
                      const ago = formatDistanceToNow(new Date(n.updated_at), { addSuffix: true });
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-colors",
                            n.unread && "bg-primary/5"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", color)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{n.repository.full_name}</p>
                            <p className={cn("text-sm leading-snug mt-0.5 truncate", n.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                              {n.subject.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{ago}</p>
                          </div>
                          {n.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10 border border-success/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <Github className="h-3.5 w-3.5 text-success" />
          <span className="text-xs font-medium text-success">Connected</span>
          {user && (
            <>
              <span className="text-success/40">·</span>
              <Avatar className="h-5 w-5">
                <AvatarImage src={user.avatar_url} alt={user.login} />
                <AvatarFallback className="text-[8px] bg-success/20 text-success">
                  {user.login.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-success">{user.login}</span>
            </>
          )}
        </div>
        <Button size="sm" className="gap-2" onClick={onAddProject}>
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>
    </header>
  );
}
