import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GitHubAdapter } from "./GitHubAdapter";
import { GITHUB_PORT } from "../../application/ports/IGitHubPort";

@Module({
  imports: [ConfigModule],
  providers: [
    GitHubAdapter,
    { provide: GITHUB_PORT, useExisting: GitHubAdapter },
  ],
  exports: [GITHUB_PORT],
})
export class GitHubModule {}
