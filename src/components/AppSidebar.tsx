import { useState } from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Star,
  Github,
  Settings,
  Code2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useGitHubUser } from "@/contexts/GitHubUserContext";
import { ProfileModal } from "@/components/ProfileModal";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/starred", label: "Starred", icon: Star },
  { to: "/github", label: "GitHub", icon: Github },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { user } = useGitHubUser();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-sidebar border-r border-border flex flex-col z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="text-base font-semibold text-foreground tracking-tight">
            DevHub
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <RouterNavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:rounded-full before:bg-primary before:transition-all before:duration-200",
                  isActive
                    ? "bg-primary/10 text-primary before:h-5 before:opacity-100"
                    : "text-sidebar-foreground hover:bg-surface-hover hover:text-foreground before:h-0 before:opacity-0 hover:before:h-3 hover:before:opacity-60"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </RouterNavLink>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="border-t border-border px-3 py-3">
          {user ? (
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-surface-hover transition-colors text-left"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} alt={user.login} />
                <AvatarFallback className="text-[10px] bg-secondary text-foreground">
                  {user.login.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{user.login}</p>
                <p className="text-[11px] text-muted-foreground">Free plan</p>
              </div>
            </button>
          ) : (
            <p className="text-xs text-muted-foreground px-2">v1.0.0</p>
          )}
        </div>
      </aside>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
