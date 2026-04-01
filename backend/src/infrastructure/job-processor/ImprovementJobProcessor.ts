import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import simpleGit from "simple-git";
import {
  IImprovementJobRepository,
  IMPROVEMENT_JOB_REPOSITORY,
} from "../../domain/improvement-job/repositories/IImprovementJobRepository";
import {
  ICoverageReportRepository,
  COVERAGE_REPORT_REPOSITORY,
} from "../../domain/coverage/repositories/ICoverageReportRepository";
import { IGitHubPort, GITHUB_PORT } from "../../application/ports/IGitHubPort";
import {
  IAiTestGeneratorPort,
  AI_TEST_GENERATOR_PORT,
} from "../../application/ports/IAiTestGeneratorPort";
import {
  ICoverageRunnerPort,
  COVERAGE_RUNNER_PORT,
} from "../../application/ports/ICoverageRunnerPort";
import { ImprovementJob } from "../../domain/improvement-job/entities/ImprovementJob";
import { RepositorySlug } from "../../domain/repository/value-objects/RepositorySlug";

// Mutex per repo to avoid concurrent processing of the same repo
const repoLocks = new Set<string>();

@Injectable()
export class ImprovementJobProcessor {
  private readonly logger = new Logger(ImprovementJobProcessor.name);

  constructor(
    @Inject(IMPROVEMENT_JOB_REPOSITORY)
    private readonly jobRepository: IImprovementJobRepository,
    @Inject(COVERAGE_REPORT_REPOSITORY)
    private readonly coverageReportRepository: ICoverageReportRepository,
    @Inject(GITHUB_PORT)
    private readonly githubPort: IGitHubPort,
    @Inject(AI_TEST_GENERATOR_PORT)
    private readonly aiTestGenerator: IAiTestGeneratorPort,
    @Inject(COVERAGE_RUNNER_PORT)
    private readonly coverageRunner: ICoverageRunnerPort,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingJobs(): Promise<void> {
    const pendingJobs = await this.jobRepository.findPendingJobs();
    for (const job of pendingJobs) {
      if (repoLocks.has(job.repositorySlug)) {
        this.logger.debug(
          `Repo ${job.repositorySlug} is locked, skipping job ${job.id}`,
        );
        continue;
      }
      // Process one job per repo at a time
      this.processJob(job).catch((err) => {
        this.logger.error(`Unhandled error in job ${job.id}: ${err}`);
      });
    }
  }

  private async processJob(job: ImprovementJob): Promise<void> {
    repoLocks.add(job.repositorySlug);
    const workDir = path.join(
      os.tmpdir(),
      "ts-coverage-improver",
      `improve_${job.id}`,
    );

    try {
      await this.runJobWithCleanup(job, workDir);
    } finally {
      repoLocks.delete(job.repositorySlug);
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }

  private async runJobWithCleanup(
    job: ImprovementJob,
    workDir: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing job ${job.id} for ${job.filePath.getValue()} in ${job.repositorySlug}`,
      );

      const slug = RepositorySlug.create(job.repositorySlug);

      // === Step 1: Clone & analyze coverage ===
      job.setCloning();
      await this.jobRepository.save(job);

      const repoInfo = await this.githubPort.getRepositoryInfo(
        slug.owner,
        slug.repo,
      );
      fs.mkdirSync(workDir, { recursive: true });

      job.setAnalyzing();
      await this.jobRepository.save(job);

      const { report, coverageFinalJson } =
        await this.coverageRunner.cloneAndRunCoverage(
          slug.getValue(),
          repoInfo.cloneUrl,
          workDir,
        );

      // Save refreshed coverage report
      await this.coverageReportRepository.save(report);

      // === Step 2: Gather source & coverage data ===
      const relativeFilePath = job.filePath.getValue();
      const absoluteFilePath = path.join(workDir, relativeFilePath);

      if (!fs.existsSync(absoluteFilePath)) {
        throw new Error(`Source file not found at ${absoluteFilePath}`);
      }

      const sourceCode = fs.readFileSync(absoluteFilePath, "utf-8");
      const testFilePath = this.resolveTestFilePath(relativeFilePath);
      const absoluteTestFilePath = path.join(workDir, testFilePath);

      let existingTestCode: string | null = null;
      if (fs.existsSync(absoluteTestFilePath)) {
        existingTestCode = fs.readFileSync(absoluteTestFilePath, "utf-8");
      }

      const { uncoveredLines, uncoveredFunctions } =
        this.coverageRunner.getUncoveredDetails(
          coverageFinalJson,
          relativeFilePath,
        );

      // === Step 3: Generate tests via AI ===
      job.setGenerating();
      await this.jobRepository.save(job);

      const { testCode } = await this.aiTestGenerator.generateTests({
        sourceFilePath: relativeFilePath,
        sourceCode,
        existingTestCode,
        uncoveredLines,
        uncoveredFunctions,
        repositorySlug: slug.getValue(),
      });

      // === Step 4: Write test file and push branch ===
      job.setSubmitting();
      await this.jobRepository.save(job);

      const branchName = `coverage-improvement/${this.sanitizeBranchSegment(relativeFilePath)}-${Date.now()}`;
      job.setBranchName(branchName);
      await this.jobRepository.save(job);

      // Write test file to workdir
      fs.mkdirSync(path.dirname(absoluteTestFilePath), { recursive: true });
      fs.writeFileSync(absoluteTestFilePath, testCode, "utf-8");

      // Git: configure, stage, commit, push
      const repoGit = simpleGit(workDir);
      const gitUserName = this.configService.get<string>(
        "GIT_USER_NAME",
        "ts-coverage-bot",
      );
      const gitUserEmail = this.configService.get<string>(
        "GIT_USER_EMAIL",
        "bot@ts-coverage-improver.local",
      );

      await repoGit.addConfig("user.name", gitUserName);
      await repoGit.addConfig("user.email", gitUserEmail);
      await repoGit.checkoutLocalBranch(branchName);
      await repoGit.add(testFilePath);
      await repoGit.commit(
        `test: add/improve coverage for ${path.basename(relativeFilePath)}\n\nAuto-generated by ts-coverage-improver`,
      );
      await repoGit.push("origin", branchName);

      // === Step 5: Create pull request ===
      const existingCoverage = report.findFile(relativeFilePath);
      const coveragePct =
        existingCoverage?.lineCoverage.getValue().toFixed(1) ?? "?";

      const prBody = this.buildPrBody(
        relativeFilePath,
        coveragePct,
        uncoveredLines.length,
      );

      const pr = await this.githubPort.createPullRequest({
        owner: slug.owner,
        repo: slug.repo,
        title: `🧪 Improve test coverage for ${path.basename(relativeFilePath)}`,
        body: prBody,
        head: branchName,
        base: repoInfo.defaultBranch,
      });

      job.complete(pr.url, pr.number, branchName);
      await this.jobRepository.save(job);

      this.logger.log(`Job ${job.id} completed. PR: ${pr.url}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Job ${job.id} failed: ${message}`);
      job.fail(message);
      await this.jobRepository.save(job);
    }
  }

  private resolveTestFilePath(sourceFilePath: string): string {
    const dir = path.dirname(sourceFilePath);
    const base = path.basename(sourceFilePath);
    const ext = path.extname(base);
    const nameWithoutExt = base.slice(0, -ext.length);
    return path.join(dir, `${nameWithoutExt}.test${ext}`);
  }

  private sanitizeBranchSegment(filePath: string): string {
    return filePath
      .replace(/[\\/.]/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 50);
  }

  private buildPrBody(
    filePath: string,
    currentCoverage: string,
    uncoveredLineCount: number,
  ): string {
    return `## 🧪 Auto-generated Test Coverage Improvement

This PR was automatically created by **ts-coverage-improver**.

### Summary
| | |
|---|---|
| **File** | \`${filePath}\` |
| **Current line coverage** | ${currentCoverage}% |
| **Uncovered lines addressed** | ~${uncoveredLineCount} |

### What was done
- Analyzed the existing test coverage for \`${filePath}\`
- Generated additional Jest tests using AI to cover uncovered code paths
- The new tests aim to push line coverage above 80%

### Review checklist
- [ ] Tests are meaningful and test real behavior
- [ ] No mocked implementation details that hide bugs  
- [ ] Tests pass in CI

> ⚠️ AI-generated tests should be reviewed before merging to ensure they test intended behavior.
`;
  }
}
