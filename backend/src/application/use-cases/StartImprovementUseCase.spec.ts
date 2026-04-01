import { StartImprovementUseCase } from "./StartImprovementUseCase";
import { IImprovementJobRepository } from "../../domain/improvement-job/repositories/IImprovementJobRepository";
import { ICoverageReportRepository } from "../../domain/coverage/repositories/ICoverageReportRepository";
import { CoverageReport } from "../../domain/coverage/entities/CoverageReport";
import { CoverageFile } from "../../domain/coverage/entities/CoverageFile";

const makeReport = (filePaths: string[]) => {
  const files = filePaths.map((fp) =>
    CoverageFile.create(
      fp,
      {
        lines: { total: 100, covered: 50, pct: 50 },
        statements: { total: 100, covered: 50, pct: 50 },
        functions: { total: 10, covered: 5, pct: 50 },
        branches: { total: 20, covered: 10, pct: 50 },
      },
      "owner/repo",
    ),
  );
  return CoverageReport.create("owner/repo", files, "sha123");
};

describe("StartImprovementUseCase", () => {
  let jobRepo: jest.Mocked<IImprovementJobRepository>;
  let coverageRepo: jest.Mocked<ICoverageReportRepository>;
  let useCase: StartImprovementUseCase;

  beforeEach(() => {
    jobRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRepositorySlug: jest.fn(),
      findPendingJobs: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    coverageRepo = {
      save: jest.fn(),
      findLatestByRepositorySlug: jest.fn(),
      findAllRepositorySlugs: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new StartImprovementUseCase(jobRepo, coverageRepo);
  });

  it("creates a PENDING job and returns its DTO", async () => {
    coverageRepo.findLatestByRepositorySlug.mockResolvedValue(
      makeReport(["src/foo.ts"]),
    );

    const dto = await useCase.execute("owner/repo", "src/foo.ts");

    expect(dto.status).toBe("PENDING");
    expect(dto.repositorySlug).toBe("owner/repo");
    expect(dto.filePath).toBe("src/foo.ts");
    expect(dto.pullRequestUrl).toBeNull();
    expect(jobRepo.save).toHaveBeenCalledTimes(1);
  });

  it("throws when no coverage report exists for the repo", async () => {
    coverageRepo.findLatestByRepositorySlug.mockResolvedValue(null);

    await expect(useCase.execute("owner/repo", "src/foo.ts")).rejects.toThrow(
      "No coverage report found for owner/repo",
    );
  });

  it("throws when the file is not in the coverage report", async () => {
    coverageRepo.findLatestByRepositorySlug.mockResolvedValue(
      makeReport(["src/other.ts"]),
    );

    await expect(
      useCase.execute("owner/repo", "src/missing.ts"),
    ).rejects.toThrow('"src/missing.ts" not found in coverage report');
  });

  it("throws for an invalid repository slug", async () => {
    await expect(
      useCase.execute("not-a-valid-slug", "src/foo.ts"),
    ).rejects.toThrow("Invalid repository slug");
  });

  it("persists the job with the repository before returning", async () => {
    coverageRepo.findLatestByRepositorySlug.mockResolvedValue(
      makeReport(["src/foo.ts"]),
    );

    await useCase.execute("owner/repo", "src/foo.ts");

    const savedJob = (jobRepo.save as jest.Mock).mock.calls[0][0];
    expect(savedJob.filePath.getValue()).toBe("src/foo.ts");
    expect(savedJob.repositorySlug).toBe("owner/repo");
  });
});
