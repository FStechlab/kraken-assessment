import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { execSync, ExecSyncOptions } from "child_process";
import simpleGit from "simple-git";
import {
  ICoverageRunnerPort,
  CoverageRunResult,
} from "../../application/ports/ICoverageRunnerPort";
import { CoverageReport } from "../../domain/coverage/entities/CoverageReport";
import { CoverageFile } from "../../domain/coverage/entities/CoverageFile";

interface CoverageSummaryEntry {
  lines: { total: number; covered: number; skipped: number; pct: number };
  statements: { total: number; covered: number; skipped: number; pct: number };
  functions: { total: number; covered: number; skipped: number; pct: number };
  branches: { total: number; covered: number; skipped: number; pct: number };
}

interface CoverageFinalEntry {
  s: Record<string, number>;
  f: Record<string, number>;
  fnMap: Record<string, { name: string; loc: { start: { line: number } } }>;
  statementMap: Record<
    string,
    { start: { line: number }; end: { line: number } }
  >;
}

@Injectable()
export class JestCoverageRunnerAdapter implements ICoverageRunnerPort {
  private readonly logger = new Logger(JestCoverageRunnerAdapter.name);

  async cloneAndRunCoverage(
    repositorySlug: string,
    cloneUrl: string,
    workDir: string,
  ): Promise<CoverageRunResult> {
    this.logger.log(`Cloning ${repositorySlug} to ${workDir}`);

    // Clone
    const git = simpleGit();
    await git.clone(cloneUrl, workDir, ["--depth", "1"]);

    // Get commit SHA
    const repoGit = simpleGit(workDir);
    const log = await repoGit.log(["-1"]);
    const commitSha = log.latest?.hash ?? "unknown";

    this.logger.log(`Installing dependencies in ${workDir}`);

    try {
      this.runCommand(
        "npm install --no-audit --no-fund --prefer-offline",
        workDir,
        120_000,
      );
    } catch (e) {
      console.error(e);
      throw e;
    }

    this.logger.log(`Running jest coverage for ${repositorySlug}`);
    const coverageSummary = this.runJestCoverage(workDir);

    const files = this.parseCoverageSummary(
      coverageSummary,
      repositorySlug,
      workDir,
    );
    const report = CoverageReport.create(repositorySlug, files, commitSha);

    const coverageFinalPath = path.join(
      workDir,
      "coverage",
      "coverage-final.json",
    );
    let coverageFinalJson: Record<string, unknown> = {};
    if (fs.existsSync(coverageFinalPath)) {
      coverageFinalJson = JSON.parse(
        fs.readFileSync(coverageFinalPath, "utf-8"),
      );
    }

    return { report, coverageFinalJson };
  }

  getUncoveredDetails(
    coverageFinalJson: Record<string, unknown>,
    filePath: string,
  ): { uncoveredLines: number[]; uncoveredFunctions: string[] } {
    // Find the matching key in coverage-final.json (keys are absolute paths)
    const key = Object.keys(coverageFinalJson).find(
      (k) => k.includes(filePath) || k.endsWith(filePath),
    );

    if (!key) {
      return { uncoveredLines: [], uncoveredFunctions: [] };
    }

    const entry = coverageFinalJson[key] as CoverageFinalEntry;
    const uncoveredLines: Set<number> = new Set();
    const uncoveredFunctions: string[] = [];

    // Find uncovered statements (→ lines)
    for (const [stmtId, count] of Object.entries(entry.s ?? {})) {
      if (count === 0) {
        const stmtMeta = entry.statementMap?.[stmtId];
        if (stmtMeta) {
          for (
            let line = stmtMeta.start.line;
            line <= stmtMeta.end.line;
            line++
          ) {
            uncoveredLines.add(line);
          }
        }
      }
    }

    // Find uncovered functions
    for (const [fnId, count] of Object.entries(entry.f ?? {})) {
      if (count === 0) {
        const fnMeta = entry.fnMap?.[fnId];
        if (fnMeta) {
          uncoveredFunctions.push(fnMeta.name ?? `function_${fnId}`);
          uncoveredLines.add(fnMeta.loc.start.line);
        }
      }
    }

    return {
      uncoveredLines: [...uncoveredLines].sort((a, b) => a - b),
      uncoveredFunctions: [...new Set(uncoveredFunctions)],
    };
  }

  private runCommand(command: string, cwd: string, timeout = 60_000): string {
    const options: ExecSyncOptions = {
      cwd,
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf-8",
    };
    return execSync(command, options) as unknown as string;
  }

  private runJestCoverage(
    workDir: string,
  ): Record<string, CoverageSummaryEntry> {
    const coverageDir = path.join(workDir, "coverage");
    const summaryPath = path.join(coverageDir, "coverage-summary.json");

    try {
      this.runCommand(
        "npx jest --coverage --coverageReporters=json-summary --coverageReporters=json --passWithNoTests --forceExit",
        workDir,
        300_000,
      );
    } catch (err: unknown) {
      // Jest exits with code 1 when tests fail; we still want coverage data
      this.logger.warn(
        "Jest exited with non-zero code (tests may have failures); checking for coverage output",
      );
      if (!fs.existsSync(summaryPath)) {
        throw new Error(
          `Jest coverage summary not found at ${summaryPath}. Error: ${String(err)}`,
        );
      }
    }

    if (!fs.existsSync(summaryPath)) {
      throw new Error(
        `Coverage summary not found at ${summaryPath}. Ensure jest is configured in the target repo.`,
      );
    }

    return JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
  }

  private parseCoverageSummary(
    summary: Record<string, CoverageSummaryEntry>,
    repositorySlug: string,
    workDir: string,
  ): CoverageFile[] {
    const files: CoverageFile[] = [];

    for (const [absolutePath, metrics] of Object.entries(summary)) {
      if (absolutePath === "total") continue;

      // Convert absolute path to relative path within the repo
      const relativePath = absolutePath.startsWith(workDir)
        ? absolutePath.slice(workDir.length).replace(/^[\\/]/, "")
        : absolutePath;

      // Only include TypeScript source files, excluding test files
      if (!relativePath.endsWith(".ts") && !relativePath.endsWith(".tsx")) {
        continue;
      }
      if (
        relativePath.includes(".test.") ||
        relativePath.includes(".spec.") ||
        relativePath.includes("__tests__")
      ) {
        continue;
      }

      try {
        files.push(CoverageFile.create(relativePath, metrics, repositorySlug));
      } catch {
        this.logger.warn(`Skipping invalid coverage entry for ${relativePath}`);
      }
    }

    return files;
  }
}
