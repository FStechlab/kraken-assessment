/**
 * NOTE: This test file is intentionally incomplete.
 * It only covers ImprovementJob.create() and basic read-only getters.
 * The following methods are NOT tested and will appear as uncovered in coverage:
 *   - reconstitute()
 *   - transitionTo(), setCloning(), setAnalyzing(), setGenerating(), setSubmitting()
 *   - complete(), fail(), setBranchName()
 *
 * This makes ImprovementJob.ts a good demonstration target for ts-coverage-improver.
 */
import { ImprovementJob } from "./ImprovementJob";
import { JobStatusValue } from "../value-objects/JobStatus";

describe("ImprovementJob", () => {
  describe("create", () => {
    it("creates a job with PENDING status", () => {
      const job = ImprovementJob.create("job-1", "owner/repo", "src/foo.ts");
      expect(job.status.getValue()).toBe(JobStatusValue.PENDING);
    });

    it("stores the id", () => {
      const job = ImprovementJob.create("job-42", "owner/repo", "src/foo.ts");
      expect(job.id).toBe("job-42");
    });

    it("stores the repositorySlug", () => {
      const job = ImprovementJob.create("id", "acme/lib", "src/foo.ts");
      expect(job.repositorySlug).toBe("acme/lib");
    });

    it("stores the filePath", () => {
      const job = ImprovementJob.create(
        "id",
        "owner/repo",
        "src/utils/calc.ts",
      );
      expect(job.filePath.getValue()).toBe("src/utils/calc.ts");
    });

    it("initialises pullRequestUrl as null", () => {
      const job = ImprovementJob.create("id", "owner/repo", "src/foo.ts");
      expect(job.pullRequestUrl).toBeNull();
    });

    it("initialises pullRequestNumber as null", () => {
      const job = ImprovementJob.create("id", "owner/repo", "src/foo.ts");
      expect(job.pullRequestNumber).toBeNull();
    });

    it("initialises branchName as null", () => {
      const job = ImprovementJob.create("id", "owner/repo", "src/foo.ts");
      expect(job.branchName).toBeNull();
    });

    it("initialises errorMessage as null", () => {
      const job = ImprovementJob.create("id", "owner/repo", "src/foo.ts");
      expect(job.errorMessage).toBeNull();
    });

    it("sets createdAt to a recent date", () => {
      const before = new Date();
      const job = ImprovementJob.create("id", "owner/repo", "src/foo.ts");
      expect(job.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it("sets updatedAt to a recent date", () => {
      const before = new Date();
      const job = ImprovementJob.create("id", "owner/repo", "src/foo.ts");
      expect(job.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });
});
