import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command } from "lucide-react";

interface ShortcutsHelpModalProps {
    open: boolean;
    onClose: () => void;
}

const shortcuts = [
    { keys: ["Cmd/Ctrl", "K"], description: "Open command palette" },
    { keys: ["Cmd/Ctrl", "N"], description: "New repository" },
    { keys: ["Cmd/Ctrl", "R"], description: "Refresh data" },
    { keys: ["G", "D"], description: "Go to Dashboard" },
    { keys: ["G", "P"], description: "Go to Projects" },
    { keys: ["G", "H"], description: "Go to GitHub Repos" },
    { keys: ["G", "S"], description: "Go to Stats" },
    { keys: ["Esc"], description: "Close modals" },
    { keys: ["?"], description: "Show shortcuts help" },
];

export function ShortcutsHelpModal({ open, onClose }: ShortcutsHelpModalProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Command className="h-4 w-4" />
                        Keyboard Shortcuts
                    </DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                    <div className="space-y-2">
                        {shortcuts.map((s, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{s.description}</span>
                                <div className="flex gap-1">
                                    {s.keys.map((k, j) => (
                                        <kbd
                                            key={j}
                                            className="inline-flex items-center justify-center rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-foreground"
                                        >
                                            {k}
                                        </kbd>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
