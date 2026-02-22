import { useState, useEffect } from "react";
import { ExternalLink, MapPin, Building, Users, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface FullProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  plan?: { name: string };
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const token = localStorage.getItem("devhub_github_token");
    if (!token) { setLoading(false); return; }

    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    })
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className={cn("fixed inset-0 bg-background/60 backdrop-blur-sm z-50 transition-opacity duration-200 opacity-100")}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-center gap-6">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-16" />
              </div>
            </div>
          ) : profile ? (
            <>
              {/* Avatar + name */}
              <div className="flex flex-col items-center pt-8 pb-4 px-6">
                <Avatar className="w-20 h-20 border-2 border-border">
                  <AvatarImage src={profile.avatar_url} alt={profile.login} />
                  <AvatarFallback className="text-lg bg-secondary text-foreground">
                    {profile.login.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold text-foreground mt-3">
                  {profile.name || profile.login}
                </h2>
                <p className="text-sm text-muted-foreground">@{profile.login}</p>
                {profile.plan && (
                  <span className="mt-2 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-medium uppercase tracking-wider">
                    {profile.plan.name} plan
                  </span>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-muted-foreground text-center px-6 pb-4">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex justify-center gap-8 px-6 pb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{profile.public_repos}</p>
                  <p className="text-[11px] text-muted-foreground">Repos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{profile.followers}</p>
                  <p className="text-[11px] text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{profile.following}</p>
                  <p className="text-[11px] text-muted-foreground">Following</p>
                </div>
              </div>

              {/* Details */}
              <div className="border-t border-border px-6 py-4 space-y-2">
                {profile.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-3.5 w-3.5" />
                    {profile.company}
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {format(new Date(profile.created_at), "MMMM yyyy")}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border px-6 py-4 flex gap-2">
                <a href={profile.html_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-2 text-sm">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View on GitHub
                  </Button>
                </a>
                <Button variant="ghost" className="text-sm text-muted-foreground" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Could not load profile
            </div>
          )}
        </div>
      </div>
    </>
  );
}
