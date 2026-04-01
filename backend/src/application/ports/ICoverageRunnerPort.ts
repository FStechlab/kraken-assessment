import { CoverageReport } from "../../domain/coverage/entities/CoverageReport";

export interface CoverageRunResult {
  report: CoverageReport;
  coverageFinalJson: Record<string, unknown>;
}

export interface ICoverageRunnerPort {
  cloneAndRunCoverage(
    repositorySlug: string,
    cloneUrl: string,
    workDir: string,
  ): Promise<CoverageRunResult>;

  getUncoveredDetails(
    coverageFinalJson: Record<string, unknown>,
    filePath: string,
  ): { uncoveredLines: number[]; uncoveredFunctions: string[] };
}

export const COVERAGE_RUNNER_PORT = Symbol("ICoverageRunnerPort");
