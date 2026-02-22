import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline";
}

interface EmptyStateProps {
  icon: LucideIcon;
  secondaryIcon?: LucideIcon;
  title: string;
  subtitle: string;
  actions?: EmptyStateAction[];
  compact?: boolean;
}

export function EmptyState({ icon: Icon, secondaryIcon: SecondaryIcon, title, subtitle, actions, compact }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center animate-fade-in",
      compact ? "py-8" : "py-20"
    )}>
      <div className={cn(
        "relative rounded-2xl bg-secondary/60 border border-border flex items-center justify-center mb-5",
        compact ? "w-12 h-12" : "w-20 h-20"
      )}>
        <Icon className={cn("text-muted-foreground", compact ? "h-5 w-5" : "h-8 w-8")} />
        {SecondaryIcon && (
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-primary/15 border border-border flex items-center justify-center">
            <SecondaryIcon className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>
      <h3 className={cn(
        "font-semibold text-foreground mb-1.5",
        compact ? "text-xs" : "text-sm"
      )}>{title}</h3>
      <p className={cn(
        "text-muted-foreground max-w-sm",
        compact ? "text-[11px]" : "text-xs"
      )}>{subtitle}</p>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2.5 mt-5">
          {actions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant={a.variant ?? "default"}
              className="text-xs h-8 px-4"
              onClick={a.onClick}
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
