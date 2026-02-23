import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

export type ShortcutAction =
    | "commandPalette"
    | "newRepo"
    | "refreshData"
    | "showHelp";

interface UseKeyboardShortcutsProps {
    onAction: (action: ShortcutAction) => void;
}

export function useKeyboardShortcuts({ onAction }: UseKeyboardShortcutsProps) {
    const navigate = useNavigate();
    const comboState = useRef<"idle" | "g_pressed">("idle");
    const comboTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput =
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable;

            const isCmdOrCtrl = e.metaKey || e.ctrlKey;

            // Allow Cmd+K, Cmd+N, Cmd+R globally even when focusing inputs
            if (isCmdOrCtrl) {
                if (e.key.toLowerCase() === "k") {
                    e.preventDefault();
                    onAction("commandPalette");
                    return;
                }
                if (e.key.toLowerCase() === "n") {
                    e.preventDefault();
                    onAction("newRepo");
                    return;
                }
                if (e.key.toLowerCase() === "r") {
                    e.preventDefault();
                    onAction("refreshData");
                    return;
                }
            }

            // Block other shortcuts like '?' or 'g+d' inside inputs
            if (isInput) return;

            if (e.key === "?") {
                e.preventDefault();
                onAction("showHelp");
                return;
            }

            if (e.key.toLowerCase() === "g" && !isCmdOrCtrl && !e.altKey && !e.shiftKey) {
                comboState.current = "g_pressed";
                if (comboTimeout.current) clearTimeout(comboTimeout.current);
                comboTimeout.current = setTimeout(() => {
                    comboState.current = "idle";
                }, 1500);
                return;
            }

            if (comboState.current === "g_pressed" && !isCmdOrCtrl && !e.altKey) {
                const key = e.key.toLowerCase();
                let handled = false;

                switch (key) {
                    case "d":
                        navigate("/");
                        handled = true;
                        break;
                    case "p":
                        navigate("/projects");
                        handled = true;
                        break;
                    case "h":
                        navigate("/github");
                        handled = true;
                        break;
                    case "s":
                        navigate("/stats");
                        handled = true;
                        break;
                }

                if (handled) {
                    e.preventDefault();
                    comboState.current = "idle";
                    if (comboTimeout.current) clearTimeout(comboTimeout.current);
                }
            }
        },
        [navigate, onAction]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (comboTimeout.current) clearTimeout(comboTimeout.current);
        };
    }, [handleKeyDown]);
}
