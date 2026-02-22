import { useState, useEffect, useCallback, useMemo } from "react";
import { Flame, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, startOfDay, eachDayOfInterval, getDay, differenceInWeeks, startOfWeek, isAfter } from "date-fns";

interface CommitHeatmapProps {
  username: string;
}

const LEVELS = [
  { min: 0, max: 0, color: "hsl(0 0% 10%)" },
  { min: 1, max: 2, color: "hsl(152 40% 20%)" },
  { min: 3, max: 5, color: "hsl(152 40% 33%)" },
  { min: 6, max: 10, color: "hsl(152 55% 52%)" },
  { min: 11, max: Infinity, color: "hsl(152 50% 60%)" },
];

function getColor(count: number) {
  for (const l of LEVELS) {
    if (count >= l.min && count <= l.max) return l.color;
  }
  return LEVELS[0].color;
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CommitHeatmap({ username }: CommitHeatmapProps) {
  const [commitMap, setCommitMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchAllEvents = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("devhub_github_token");
    if (!token || !username) { setLoading(false); return; }

    const map: Record<string, number> = {};
    try {
      // Fetch up to 3 pages (300 events, GitHub max for this endpoint)
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(
          `https://api.github.com/users/${username}/events?per_page=100&page=${page}`,
          { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
        );
        if (!res.ok) break;
        const events: { type: string; created_at: string; payload: { size?: number; commits?: unknown[] } }[] = await res.json();
        if (events.length === 0) break;
        for (const e of events) {
          if (e.type === "PushEvent") {
            const day = format(new Date(e.created_at), "yyyy-MM-dd");
            const commits = e.payload.size || e.payload.commits?.length || 1;
            map[day] = (map[day] || 0) + commits;
          }
        }
      }
    } catch {
      // silent
    }
    setCommitMap(map);
    setLoading(false);
  }, [username]);

  useEffect(() => { fetchAllEvents(); }, [fetchAllEvents]);

  // Build 52-week grid
  const today = startOfDay(new Date());
  const yearAgo = subDays(today, 364);
  const gridStart = startOfWeek(yearAgo, { weekStartsOn: 0 });

  const allDays = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: today }),
    [gridStart.getTime(), today.getTime()]
  );

  // Group into weeks (columns)
  const weeks = useMemo(() => {
    const w: Date[][] = [];
    let current: Date[] = [];
    for (const d of allDays) {
      if (getDay(d) === 0 && current.length > 0) {
        w.push(current);
        current = [];
      }
      current.push(d);
    }
    if (current.length > 0) w.push(current);
    return w;
  }, [allDays]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = week[0];
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        labels.push({ label: MONTH_NAMES[m], weekIndex: wi });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  // Stats
  const stats = useMemo(() => {
    const keys = Object.keys(commitMap).sort();
    const totalCommits = Object.values(commitMap).reduce((s, c) => s + c, 0);

    // Current streak
    let currentStreak = 0;
    let d = today;
    while (true) {
      const key = format(d, "yyyy-MM-dd");
      if (commitMap[key] && commitMap[key] > 0) {
        currentStreak++;
        d = subDays(d, 1);
      } else {
        // check if today has no commits yet but yesterday did
        if (currentStreak === 0) {
          d = subDays(d, 1);
          const yKey = format(d, "yyyy-MM-dd");
          if (commitMap[yKey] && commitMap[yKey] > 0) {
            currentStreak++;
            d = subDays(d, 1);
            while (commitMap[format(d, "yyyy-MM-dd")] > 0) {
              currentStreak++;
              d = subDays(d, 1);
            }
          }
        }
        break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let streak = 0;
    for (const day of allDays) {
      const key = format(day, "yyyy-MM-dd");
      if (commitMap[key] && commitMap[key] > 0) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 0;
      }
    }

    // Most active day
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    for (const [key, count] of Object.entries(commitMap)) {
      const dayOfWeek = getDay(new Date(key));
      dayTotals[dayOfWeek] += count;
    }
    const maxDay = dayTotals.indexOf(Math.max(...dayTotals));
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return { totalCommits, currentStreak, longestStreak, mostActiveDay: dayNames[maxDay] };
  }, [commitMap, allDays, today]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 space-y-4 animate-fade-in">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[120px] w-full rounded" />
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-24" />)}
        </div>
      </div>
    );
  }

  const CELL = 11;
  const GAP = 3;

  return (
    <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
      <h2 className="text-sm font-semibold text-foreground mb-4">Contribution Activity</h2>

      <div className="overflow-x-auto">
        <TooltipProvider delayDuration={100}>
          <div className="inline-flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col mr-2 pt-[18px]" style={{ gap: GAP }}>
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="text-[10px] text-muted-foreground leading-none" style={{ height: CELL }}>
                  {label}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div>
              {/* Month labels */}
              <div className="flex mb-1" style={{ height: 14 }}>
                {monthLabels.map((m, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-muted-foreground absolute"
                    style={{ position: "relative", left: m.weekIndex * (CELL + GAP) - (i > 0 ? monthLabels[i - 1].weekIndex * (CELL + GAP) : 0), width: 30 }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>

              <div className="flex" style={{ gap: GAP }}>
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                    {/* Pad first week */}
                    {wi === 0 && Array.from({ length: getDay(week[0]) }).map((_, i) => (
                      <div key={`pad-${i}`} style={{ width: CELL, height: CELL }} />
                    ))}
                    {week.map((day) => {
                      const key = format(day, "yyyy-MM-dd");
                      const count = commitMap[key] || 0;
                      const color = getColor(count);
                      const label = `${count} commit${count !== 1 ? "s" : ""} on ${format(day, "MMMM d, yyyy")}`;
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <div
                              className="rounded-[2px] transition-colors hover:ring-1 hover:ring-foreground/30"
                              style={{ width: CELL, height: CELL, backgroundColor: color }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground mr-1">Less</span>
        {LEVELS.map((l, i) => (
          <div key={i} className="rounded-[2px]" style={{ width: CELL, height: CELL, backgroundColor: l.color }} />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">More</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{stats.totalCommits}</p>
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" /> This year
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{stats.currentStreak}</p>
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <Flame className="h-3 w-3" /> Current streak
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{stats.longestStreak}</p>
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3" /> Longest streak
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{stats.mostActiveDay}</p>
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <BarChart3 className="h-3 w-3" /> Most active
          </p>
        </div>
      </div>
    </div>
  );
}
