export enum JobStatusValue {
  PENDING = "PENDING",
  CLONING = "CLONING",
  ANALYZING = "ANALYZING",
  GENERATING = "GENERATING",
  SUBMITTING = "SUBMITTING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export class JobStatus {
  private constructor(private readonly value: JobStatusValue) {}

  static pending(): JobStatus {
    return new JobStatus(JobStatusValue.PENDING);
  }

  static cloning(): JobStatus {
    return new JobStatus(JobStatusValue.CLONING);
  }

  static analyzing(): JobStatus {
    return new JobStatus(JobStatusValue.ANALYZING);
  }

  static generating(): JobStatus {
    return new JobStatus(JobStatusValue.GENERATING);
  }

  static submitting(): JobStatus {
    return new JobStatus(JobStatusValue.SUBMITTING);
  }

  static completed(): JobStatus {
    return new JobStatus(JobStatusValue.COMPLETED);
  }

  static failed(): JobStatus {
    return new JobStatus(JobStatusValue.FAILED);
  }

  static fromString(value: string): JobStatus {
    const found = Object.values(JobStatusValue).find((v) => v === value);
    if (!found) throw new Error(`Invalid job status: ${value}`);
    return new JobStatus(found);
  }

  getValue(): JobStatusValue {
    return this.value;
  }

  isTerminal(): boolean {
    return (
      this.value === JobStatusValue.COMPLETED ||
      this.value === JobStatusValue.FAILED
    );
  }

  isInProgress(): boolean {
    return (
      this.value === JobStatusValue.CLONING ||
      this.value === JobStatusValue.ANALYZING ||
      this.value === JobStatusValue.GENERATING ||
      this.value === JobStatusValue.SUBMITTING
    );
  }

  equals(other: JobStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
