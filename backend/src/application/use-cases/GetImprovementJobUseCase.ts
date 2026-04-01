import { Inject, Injectable } from "@nestjs/common";
import {
  IImprovementJobRepository,
  IMPROVEMENT_JOB_REPOSITORY,
} from "../../domain/improvement-job/repositories/IImprovementJobRepository";
import { ImprovementJobDto } from "../dtos/ImprovementJobDto";
import { ImprovementJob } from "../../domain/improvement-job/entities/ImprovementJob";

@Injectable()
export class GetImprovementJobUseCase {
  constructor(
    @Inject(IMPROVEMENT_JOB_REPOSITORY)
    private readonly jobRepository: IImprovementJobRepository,
  ) {}

  async findById(id: string): Promise<ImprovementJobDto | null> {
    const job = await this.jobRepository.findById(id);
    return job ? this.toDto(job) : null;
  }

  async findByRepositorySlug(
    repositorySlug: string,
  ): Promise<ImprovementJobDto[]> {
    const jobs = await this.jobRepository.findByRepositorySlug(repositorySlug);
    return jobs.map((j) => this.toDto(j));
  }

  async findAll(): Promise<ImprovementJobDto[]> {
    const jobs = await this.jobRepository.findAll();
    return jobs.map((j) => this.toDto(j));
  }

  private toDto(job: ImprovementJob): ImprovementJobDto {
    return {
      id: job.id,
      repositorySlug: job.repositorySlug,
      filePath: job.filePath.getValue(),
      status: job.status.toString(),
      pullRequestUrl: job.pullRequestUrl,
      pullRequestNumber: job.pullRequestNumber,
      branchName: job.branchName,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
