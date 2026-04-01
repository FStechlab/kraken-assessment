import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Octokit } from "@octokit/rest";
import {
  IGitHubPort,
  GitHubRepoInfo,
  GitHubPullRequest,
} from "../../application/ports/IGitHubPort";
import { error } from "console";

@Injectable()
export class GitHubAdapter implements IGitHubPort {
  private readonly logger = new Logger(GitHubAdapter.name);
  private readonly octokit: Octokit;
  private readonly token: string;

  constructor(private readonly configService: ConfigService) {
    this.token = this.configService.getOrThrow<string>("GITHUB_TOKEN");
    this.octokit = new Octokit({ auth: this.token });
  }

  async getRepositoryInfo(
    owner: string,
    repo: string,
  ): Promise<GitHubRepoInfo> {
    const { data } = await this.octokit.repos
      .get({ owner, repo })
      .catch((e) => {
        this.logger.error(e);
        throw e;
      });

    const cloneUrl = `https://${this.token}@github.com/${owner}/${repo}.git`;

    return {
      owner,
      repo,
      defaultBranch: data.default_branch,
      cloneUrl,
      hasTests: true, // assume true; we'll discover during clone
    };
  }

  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromRef: string,
  ): Promise<void> {
    const { data: refData } = await this.octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${fromRef}`,
    });

    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    this.logger.log(
      `Created branch ${branchName} from ${fromRef} in ${owner}/${repo}`,
    );
  }

  async createPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<GitHubPullRequest> {
    const { data } = await this.octokit.pulls.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      head: params.head,
      base: params.base,
    });

    this.logger.log(
      `Created PR #${data.number} in ${params.owner}/${params.repo}`,
    );
    return {
      number: data.number,
      url: data.html_url,
      title: data.title,
    };
  }

  async getFileContent(
    owner: string,
    repo: string,
    filePath: string,
    ref?: string,
  ): Promise<string | null> {
    try {
      const params: Parameters<typeof this.octokit.repos.getContent>[0] = {
        owner,
        repo,
        path: filePath,
      };
      if (ref) params.ref = ref;

      const { data } = await this.octokit.repos.getContent(params);
      if ("content" in data && typeof data.content === "string") {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }
      return null;
    } catch {
      return null;
    }
  }

  async getCurrentCommitSha(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<string> {
    const { data } = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch,
    });
    return data.commit.sha;
  }
}
