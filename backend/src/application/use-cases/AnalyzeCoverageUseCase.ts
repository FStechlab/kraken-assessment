import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  ICoverageRunnerPort,
  COVERAGE_RUNNER_PORT,
} from "../ports/ICoverageRunnerPort";
import { IGitHubPort, GITHUB_PORT } from "../ports/IGitHubPort";
import {
  ICoverageReportRepository,
  COVERAGE_REPORT_REPOSITORY,
} from "../../domain/coverage/repositories/ICoverageReportRepository";
import { CoverageReportDto, CoverageFileDto } from "../dtos/CoverageReportDto";
import { RepositorySlug } from "../../domain/repository/value-objects/RepositorySlug";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

const DEFAULT_THRESHOLD = 80;

@Injectable()
export class AnalyzeCoverageUseCase {
  private readonly logger = new Logger(AnalyzeCoverageUseCase.name);

  constructor(
    @Inject(COVERAGE_RUNNER_PORT)
    private readonly coverageRunner: ICoverageRunnerPort,
    @Inject(GITHUB_PORT)
    private readonly githubPort: IGitHubPort,
    @Inject(COVERAGE_REPORT_REPOSITORY)
    private readonly coverageReportRepository: ICoverageReportRepository,
  ) {}

  async execute(
    slugString: string,
    threshold: number = DEFAULT_THRESHOLD,
  ): Promise<CoverageReportDto> {
    const slug = RepositorySlug.create(slugString);
    this.logger.log(`Analyzing coverage for ${slug.getValue()}`);

    const repoInfo = await this.githubPort.getRepositoryInfo(
      slug.owner,
      slug.repo,
    );

    const workDir = path.join(
      os.tmpdir(),
      "ts-coverage-improver",
      `${slug.owner}_${slug.repo}_${Date.now()}`,
    );

    try {
      fs.mkdirSync(workDir, { recursive: true });

      const { report } = await this.coverageRunner.cloneAndRunCoverage(
        slug.getValue(),
        repoInfo.cloneUrl,
        workDir,
      );

      await this.coverageReportRepository.save(report);

      const fileDtos: CoverageFileDto[] = report.files.map((f) => ({
        filePath: f.filePath.getValue(),
        lineCoverage: f.lineCoverage.getValue(),
        statementCoverage: f.statementCoverage.getValue(),
        functionCoverage: f.functionCoverage.getValue(),
        branchCoverage: f.branchCoverage.getValue(),
        needsImprovement: f.needsImprovement(threshold),
        metrics: {
          lines: {
            total: f.metrics.lines.total,
            covered: f.metrics.lines.covered,
          },
          statements: {
            total: f.metrics.statements.total,
            covered: f.metrics.statements.covered,
          },
          functions: {
            total: f.metrics.functions.total,
            covered: f.metrics.functions.covered,
          },
          branches: {
            total: f.metrics.branches.total,
            covered: f.metrics.branches.covered,
          },
        },
      }));

      return {
        repositorySlug: slug.getValue(),
        overallLineCoverage: report.getOverallLineCoverage().getValue(),
        analyzedAt: report.analyzedAt.toISOString(),
        commitSha: report.commitSha,
        files: fileDtos,
        threshold,
      };
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }

  async getLatest(
    slugString: string,
    threshold: number = DEFAULT_THRESHOLD,
  ): Promise<CoverageReportDto | null> {
    const slug = RepositorySlug.create(slugString);
    const report =
      await this.coverageReportRepository.findLatestByRepositorySlug(
        slug.getValue(),
      );
    if (!report) return null;

    const fileDtos: CoverageFileDto[] = report.files.map((f) => ({
      filePath: f.filePath.getValue(),
      lineCoverage: f.lineCoverage.getValue(),
      statementCoverage: f.statementCoverage.getValue(),
      functionCoverage: f.functionCoverage.getValue(),
      branchCoverage: f.branchCoverage.getValue(),
      needsImprovement: f.needsImprovement(threshold),
      metrics: {
        lines: {
          total: f.metrics.lines.total,
          covered: f.metrics.lines.covered,
        },
        statements: {
          total: f.metrics.statements.total,
          covered: f.metrics.statements.covered,
        },
        functions: {
          total: f.metrics.functions.total,
          covered: f.metrics.functions.covered,
        },
        branches: {
          total: f.metrics.branches.total,
          covered: f.metrics.branches.covered,
        },
      },
    }));

    return {
      repositorySlug: slug.getValue(),
      overallLineCoverage: report.getOverallLineCoverage().getValue(),
      analyzedAt: report.analyzedAt.toISOString(),
      commitSha: report.commitSha,
      files: fileDtos,
      threshold,
    };
  }
}
