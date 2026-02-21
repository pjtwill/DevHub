import { Language } from "@/data/types";

const languageConfig: Record<string, { icon: string; color: string }> = {
  React: { icon: "⚛", color: "hsl(197, 71%, 55%)" },
  Node: { icon: "⬢", color: "hsl(120, 40%, 50%)" },
  Python: { icon: "🐍", color: "hsl(207, 51%, 52%)" },
  Rust: { icon: "🦀", color: "hsl(16, 80%, 55%)" },
  Go: { icon: "🔵", color: "hsl(195, 60%, 50%)" },
  TypeScript: { icon: "TS", color: "hsl(211, 60%, 48%)" },
  JavaScript: { icon: "JS", color: "hsl(48, 89%, 50%)" },
  Shell: { icon: "$", color: "hsl(0, 0%, 60%)" },
};

export function getLanguageConfig(lang: Language | string) {
  return languageConfig[lang] || { icon: "📁", color: "hsl(0, 0%, 60%)" };
}
