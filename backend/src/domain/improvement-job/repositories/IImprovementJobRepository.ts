import { ImprovementJob } from "../entities/ImprovementJob";

export interface IImprovementJobRepository {
  save(job: ImprovementJob): Promise<void>;
  findById(id: string): Promise<ImprovementJob | null>;
  findByRepositorySlug(repositorySlug: string): Promise<ImprovementJob[]>;
  findPendingJobs(): Promise<ImprovementJob[]>;
  findAll(): Promise<ImprovementJob[]>;
  delete(id: string): Promise<void>;
}

export const IMPROVEMENT_JOB_REPOSITORY = Symbol("IImprovementJobRepository");
