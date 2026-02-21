import { Commit, Branch, FileTreeNode } from "./types";

// Per-project mock data keyed by project id
const commitsByProject: Record<string, Commit[]> = {
  "1": [
    { hash: "a3f8c12", message: "feat: add project card hover states", author: "you", time: "2h ago", branch: "main" },
    { hash: "f1e9b34", message: "refactor: extract sidebar component", author: "you", time: "5h ago", branch: "main" },
    { hash: "c82a6d1", message: "feat: implement dashboard stats", author: "you", time: "1d ago", branch: "main" },
    { hash: "9e4f0a7", message: "fix: correct routing for nested pages", author: "you", time: "1d ago", branch: "main" },
    { hash: "2b7c1e3", message: "chore: setup tailwind + shadcn", author: "you", time: "2d ago", branch: "main" },
    { hash: "d0a4f82", message: "feat: initial project scaffold", author: "you", time: "3d ago", branch: "main" },
    { hash: "0001abc", message: "init: create-react-app with vite", author: "you", time: "4d ago", branch: "main" },
  ],
  "2": [
    { hash: "b7e2d45", message: "fix: rate limiter edge case", author: "you", time: "5h ago", branch: "develop" },
    { hash: "a1c3e89", message: "feat: add redis caching layer", author: "you", time: "1d ago", branch: "develop" },
    { hash: "7f2b4c6", message: "refactor: middleware pipeline", author: "you", time: "2d ago", branch: "develop" },
    { hash: "e9d1a73", message: "feat: JWT validation endpoint", author: "you", time: "3d ago", branch: "main" },
    { hash: "3c8f2e1", message: "init: express + typescript setup", author: "you", time: "1w ago", branch: "main" },
  ],
  "3": [
    { hash: "c9d1f78", message: "refactor: optimize training loop", author: "you", time: "1d ago", branch: "feature/v2" },
    { hash: "8a2e4b9", message: "feat: add data augmentation step", author: "you", time: "2d ago", branch: "feature/v2" },
    { hash: "1f7c3d5", message: "fix: memory leak in dataloader", author: "you", time: "3d ago", branch: "main" },
    { hash: "b4e9a12", message: "feat: model evaluation metrics", author: "you", time: "5d ago", branch: "main" },
    { hash: "6d3f8c7", message: "init: pytorch project structure", author: "you", time: "1w ago", branch: "main" },
  ],
};

const branchesByProject: Record<string, Branch[]> = {
  "1": [
    { name: "main", isDefault: true, lastCommit: "a3f8c12", aheadBehind: "up to date" },
    { name: "feature/detail-page", isDefault: false, lastCommit: "ff8a123", aheadBehind: "2 ahead" },
    { name: "fix/sidebar-width", isDefault: false, lastCommit: "cc1d456", aheadBehind: "1 behind" },
  ],
  "2": [
    { name: "main", isDefault: true, lastCommit: "e9d1a73", aheadBehind: "up to date" },
    { name: "develop", isDefault: false, lastCommit: "b7e2d45", aheadBehind: "3 ahead" },
    { name: "feature/rate-limit", isDefault: false, lastCommit: "a1c3e89", aheadBehind: "1 ahead" },
  ],
  "3": [
    { name: "main", isDefault: true, lastCommit: "1f7c3d5", aheadBehind: "up to date" },
    { name: "feature/v2", isDefault: false, lastCommit: "c9d1f78", aheadBehind: "2 ahead" },
    { name: "experiment/transformer", isDefault: false, lastCommit: "d4a2e90", aheadBehind: "5 ahead, 1 behind" },
  ],
};

const fileTreeByProject: Record<string, FileTreeNode[]> = {
  "1": [
    { name: "src", type: "folder", children: [
      { name: "components", type: "folder", children: [
        { name: "AppLayout.tsx", type: "file" },
        { name: "AppSidebar.tsx", type: "file" },
        { name: "ProjectCard.tsx", type: "file" },
        { name: "TopBar.tsx", type: "file" },
      ]},
      { name: "pages", type: "folder", children: [
        { name: "Dashboard.tsx", type: "file" },
        { name: "Projects.tsx", type: "file" },
        { name: "GitHubPage.tsx", type: "file" },
        { name: "SettingsPage.tsx", type: "file" },
      ]},
      { name: "data", type: "folder", children: [
        { name: "mockData.ts", type: "file" },
        { name: "types.ts", type: "file" },
      ]},
      { name: "App.tsx", type: "file" },
      { name: "main.tsx", type: "file" },
      { name: "index.css", type: "file" },
    ]},
    { name: "public", type: "folder", children: [
      { name: "favicon.ico", type: "file" },
    ]},
    { name: "package.json", type: "file" },
    { name: "tsconfig.json", type: "file" },
    { name: "vite.config.ts", type: "file" },
    { name: "tailwind.config.ts", type: "file" },
    { name: "README.md", type: "file" },
  ],
  "2": [
    { name: "src", type: "folder", children: [
      { name: "routes", type: "folder", children: [
        { name: "auth.ts", type: "file" },
        { name: "users.ts", type: "file" },
        { name: "health.ts", type: "file" },
      ]},
      { name: "middleware", type: "folder", children: [
        { name: "rateLimiter.ts", type: "file" },
        { name: "jwtValidator.ts", type: "file" },
        { name: "cors.ts", type: "file" },
      ]},
      { name: "index.ts", type: "file" },
      { name: "config.ts", type: "file" },
    ]},
    { name: "package.json", type: "file" },
    { name: "tsconfig.json", type: "file" },
    { name: "Dockerfile", type: "file" },
    { name: ".env.example", type: "file" },
  ],
  "3": [
    { name: "src", type: "folder", children: [
      { name: "models", type: "folder", children: [
        { name: "transformer.py", type: "file" },
        { name: "encoder.py", type: "file" },
      ]},
      { name: "data", type: "folder", children: [
        { name: "loader.py", type: "file" },
        { name: "augment.py", type: "file" },
      ]},
      { name: "train.py", type: "file" },
      { name: "evaluate.py", type: "file" },
    ]},
    { name: "requirements.txt", type: "file" },
    { name: "setup.py", type: "file" },
    { name: "README.md", type: "file" },
  ],
};

// Default fallback data for projects without specific mock data
const defaultCommits: Commit[] = [
  { hash: "abc1234", message: "feat: initial implementation", author: "you", time: "1d ago", branch: "main" },
  { hash: "def5678", message: "chore: setup project", author: "you", time: "3d ago", branch: "main" },
];
const defaultBranches: Branch[] = [
  { name: "main", isDefault: true, lastCommit: "abc1234", aheadBehind: "up to date" },
];
const defaultFileTree: FileTreeNode[] = [
  { name: "src", type: "folder", children: [{ name: "index.ts", type: "file" }] },
  { name: "package.json", type: "file" },
  { name: "README.md", type: "file" },
];

export function getProjectCommits(projectId: string): Commit[] {
  return commitsByProject[projectId] || defaultCommits;
}

export function getProjectBranches(projectId: string): Branch[] {
  return branchesByProject[projectId] || defaultBranches;
}

export function getProjectFileTree(projectId: string): FileTreeNode[] {
  return fileTreeByProject[projectId] || defaultFileTree;
}
