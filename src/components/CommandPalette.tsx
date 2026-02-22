import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FolderOpen,
  LayoutDashboard,
  FolderKanban,
  Github,
  Settings,
  ArrowRight,
  Command,
} from "lucide-react";
import { mockProjects } from "@/data/mockData";
import { getLanguageConfig } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: "project" | "navigation" | "action";
  action: () => void;
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const allItems: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = [
      { id: "nav-dash", label: "Dashboard", description: "Go to dashboard", icon: <LayoutDashboard className="h-4 w-4" />, category: "navigation", action: () => { navigate("/"); onClose(); } },
      { id: "nav-proj", label: "Projects", description: "View all projects", icon: <FolderKanban className="h-4 w-4" />, category: "navigation", action: () => { navigate("/projects"); onClose(); } },
      { id: "nav-gh", label: "GitHub", description: "GitHub repositories", icon: <Github className="h-4 w-4" />, category: "navigation", action: () => { navigate("/github"); onClose(); } },
      { id: "nav-set", label: "Settings", description: "App settings", icon: <Settings className="h-4 w-4" />, category: "navigation", action: () => { navigate("/settings"); onClose(); } },
    ];

    const projectItems: CommandItem[] = mockProjects.flatMap((p) => {
      const lang = getLanguageConfig(p.language);
      return [
        {
          id: `proj-${p.id}`,
          label: p.name,
          description: `${p.language} · ${p.branch}`,
          icon: <span style={{ color: lang.color }} className="text-sm font-semibold w-4 text-center">{lang.icon}</span>,
          category: "project" as const,
          action: () => { navigate(`/projects/${p.id}`); onClose(); },
        },
        {
          id: `vscode-${p.id}`,
          label: `Open ${p.name} in VS Code`,
          description: p.localPath,
          icon: <FolderOpen className="h-4 w-4" />,
          category: "action" as const,
          action: () => { toast.success("Opening in VS Code...", { description: p.localPath }); onClose(); },
        },
      ];
    });

    return [...navItems, ...projectItems];
  }, [navigate, onClose]);

  const filtered = useMemo(() => {
    if (!query) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [query, allItems]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: { category: string; items: CommandItem[] }[] = [];
    const catOrder = ["navigation", "project", "action"];
    const catLabels: Record<string, string> = { navigation: "Navigate", project: "Projects", action: "Actions" };
    for (const cat of catOrder) {
      const items = filtered.filter((i) => i.category === cat);
      if (items.length) groups.push({ category: catLabels[cat], items });
    }
    return groups;
  }, [filtered]);

  const flatFiltered = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, flatFiltered.length - 1)));
  }, [flatFiltered.length]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatFiltered[selectedIndex]?.action();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [flatFiltered, selectedIndex, onClose]
  );

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 animate-scale-in">
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
            {grouped.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.category}>
                  <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.category}
                  </p>
                  {group.items.map((item) => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors",
                          idx === selectedIndex
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-surface-hover"
                        )}
                      >
                        <span className="flex-shrink-0 w-5 flex justify-center">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{item.label}</span>
                          {item.description && (
                            <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
                          )}
                        </div>
                        {idx === selectedIndex && (
                          <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-secondary font-mono">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-secondary font-mono">↵</kbd> select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-secondary font-mono">esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
