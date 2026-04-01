export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  cloneUrl: string;
  hasTests: boolean;
}

export interface GitHubPullRequest {
  number: number;
  url: string;
  title: string;
}

export interface IGitHubPort {
  getRepositoryInfo(owner: string, repo: string): Promise<GitHubRepoInfo>;
  createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromRef: string,
  ): Promise<void>;
  createPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<GitHubPullRequest>;
  getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string,
  ): Promise<string | null>;
  getCurrentCommitSha(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<string>;
}

export const GITHUB_PORT = Symbol("IGitHubPort");
