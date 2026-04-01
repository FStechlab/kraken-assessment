import { JobStatus } from "../value-objects/JobStatus";
import { FilePath } from "../../coverage/value-objects/FilePath";

export class ImprovementJob {
  private constructor(
    private readonly _id: string,
    private readonly _repositorySlug: string,
    private _filePath: FilePath,
    private _status: JobStatus,
    private _pullRequestUrl: string | null,
    private _pullRequestNumber: number | null,
    private _branchName: string | null,
    private _errorMessage: string | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(
    id: string,
    repositorySlug: string,
    filePath: string,
  ): ImprovementJob {
    return new ImprovementJob(
      id,
      repositorySlug,
      FilePath.create(filePath),
      JobStatus.pending(),
      null,
      null,
      null,
      null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(params: {
    id: string;
    repositorySlug: string;
    filePath: string;
    status: string;
    pullRequestUrl: string | null;
    pullRequestNumber: number | null;
    branchName: string | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ImprovementJob {
    return new ImprovementJob(
      params.id,
      params.repositorySlug,
      FilePath.create(params.filePath),
      JobStatus.fromString(params.status),
      params.pullRequestUrl,
      params.pullRequestNumber,
      params.branchName,
      params.errorMessage,
      params.createdAt,
      params.updatedAt,
    );
  }

  get id(): string {
    return this._id;
  }

  get repositorySlug(): string {
    return this._repositorySlug;
  }

  get filePath(): FilePath {
    return this._filePath;
  }

  get status(): JobStatus {
    return this._status;
  }

  get pullRequestUrl(): string | null {
    return this._pullRequestUrl;
  }

  get pullRequestNumber(): number | null {
    return this._pullRequestNumber;
  }

  get branchName(): string | null {
    return this._branchName;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  transitionTo(status: JobStatus): void {
    this._status = status;
    this._updatedAt = new Date();
  }

  setCloning(): void {
    this.transitionTo(JobStatus.cloning());
  }

  setAnalyzing(): void {
    this.transitionTo(JobStatus.analyzing());
  }

  setGenerating(): void {
    this.transitionTo(JobStatus.generating());
  }

  setSubmitting(): void {
    this.transitionTo(JobStatus.submitting());
  }

  complete(
    pullRequestUrl: string,
    pullRequestNumber: number,
    branchName: string,
  ): void {
    this._pullRequestUrl = pullRequestUrl;
    this._pullRequestNumber = pullRequestNumber;
    this._branchName = branchName;
    this.transitionTo(JobStatus.completed());
  }

  fail(errorMessage: string): void {
    this._errorMessage = errorMessage;
    this.transitionTo(JobStatus.failed());
  }

  setBranchName(branchName: string): void {
    this._branchName = branchName;
    this._updatedAt = new Date();
  }
}
