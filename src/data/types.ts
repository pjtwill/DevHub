export type SyncStatus = "synced" | "uncommitted" | "behind";
export type Language = "React" | "Node" | "Python" | "Rust" | "Go" | "TypeScript" | "JavaScript" | "Shell";

export interface Project {
  id: string;
  name: string;
  language: Language;
  githubUrl: string;
  lastCommitMessage: string;
  lastCommitTime: string;
  lastCommitHash: string;
  branch: string;
  localPath: string;
  syncStatus: SyncStatus;
  lastModified: string;
}

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  isLinked: boolean;
}

export interface Activity {
  id: string;
  project: string;
  message: string;
  hash: string;
  time: string;
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  time: string;
  branch: string;
}

export interface Branch {
  name: string;
  isDefault: boolean;
  lastCommit: string;
  aheadBehind: string;
}

export interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}
