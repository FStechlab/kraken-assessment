import { JobStatus, JobStatusValue } from "./JobStatus";

describe("JobStatus", () => {
  describe("factory methods", () => {
    it.each([
      ["pending", JobStatusValue.PENDING],
      ["cloning", JobStatusValue.CLONING],
      ["analyzing", JobStatusValue.ANALYZING],
      ["generating", JobStatusValue.GENERATING],
      ["submitting", JobStatusValue.SUBMITTING],
      ["completed", JobStatusValue.COMPLETED],
      ["failed", JobStatusValue.FAILED],
    ])("%s() creates status with value %s", (method, expected) => {
      const status = (JobStatus as unknown as Record<string, () => JobStatus>)[
        method
      ]();
      expect(status.getValue()).toBe(expected);
    });
  });

  describe("fromString", () => {
    it("creates a status from a valid string", () => {
      expect(JobStatus.fromString("PENDING").getValue()).toBe(
        JobStatusValue.PENDING,
      );
      expect(JobStatus.fromString("COMPLETED").getValue()).toBe(
        JobStatusValue.COMPLETED,
      );
    });

    it("throws for an unknown status string", () => {
      expect(() => JobStatus.fromString("UNKNOWN")).toThrow(
        "Invalid job status: UNKNOWN",
      );
    });
  });

  describe("isTerminal", () => {
    it("returns true for COMPLETED", () => {
      expect(JobStatus.completed().isTerminal()).toBe(true);
    });

    it("returns true for FAILED", () => {
      expect(JobStatus.failed().isTerminal()).toBe(true);
    });

    it.each(["pending", "cloning", "analyzing", "generating", "submitting"])(
      "returns false for %s",
      (method) => {
        const status = (
          JobStatus as unknown as Record<string, () => JobStatus>
        )[method]();
        expect(status.isTerminal()).toBe(false);
      },
    );
  });

  describe("isInProgress", () => {
    it.each(["cloning", "analyzing", "generating", "submitting"])(
      "returns true for %s",
      (method) => {
        const status = (
          JobStatus as unknown as Record<string, () => JobStatus>
        )[method]();
        expect(status.isInProgress()).toBe(true);
      },
    );

    it("returns false for PENDING", () => {
      expect(JobStatus.pending().isInProgress()).toBe(false);
    });

    it("returns false for COMPLETED", () => {
      expect(JobStatus.completed().isInProgress()).toBe(false);
    });

    it("returns false for FAILED", () => {
      expect(JobStatus.failed().isInProgress()).toBe(false);
    });
  });

  describe("equals", () => {
    it("returns true for equal statuses", () => {
      expect(JobStatus.pending().equals(JobStatus.pending())).toBe(true);
    });

    it("returns false for different statuses", () => {
      expect(JobStatus.pending().equals(JobStatus.completed())).toBe(false);
    });
  });

  describe("toString", () => {
    it("returns the enum string value", () => {
      expect(JobStatus.pending().toString()).toBe("PENDING");
      expect(JobStatus.failed().toString()).toBe("FAILED");
    });
  });
});
