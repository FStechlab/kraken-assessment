import { Inject, Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  IImprovementJobRepository,
  IMPROVEMENT_JOB_REPOSITORY,
} from "../../domain/improvement-job/repositories/IImprovementJobRepository";
import {
  ICoverageReportRepository,
  COVERAGE_REPORT_REPOSITORY,
} from "../../domain/coverage/repositories/ICoverageReportRepository";
import { ImprovementJob } from "../../domain/improvement-job/entities/ImprovementJob";
import { ImprovementJobDto } from "../dtos/ImprovementJobDto";
import { RepositorySlug } from "../../domain/repository/value-objects/RepositorySlug";

@Injectable()
export class StartImprovementUseCase {
  private readonly logger = new Logger(StartImprovementUseCase.name);

  constructor(
    @Inject(IMPROVEMENT_JOB_REPOSITORY)
    private readonly jobRepository: IImprovementJobRepository,
    @Inject(COVERAGE_REPORT_REPOSITORY)
    private readonly coverageReportRepository: ICoverageReportRepository,
  ) {}

  async execute(
    slugString: string,
    filePath: string,
  ): Promise<ImprovementJobDto> {
    const slug = RepositorySlug.create(slugString);

    const report =
      await this.coverageReportRepository.findLatestByRepositorySlug(
        slug.getValue(),
      );

    if (!report) {
      throw new Error(
        `No coverage report found for ${slug.getValue()}. Run analysis first.`,
      );
    }

    const coverageFile = report.findFile(filePath);
    if (!coverageFile) {
      throw new Error(
        `File "${filePath}" not found in coverage report for ${slug.getValue()}`,
      );
    }

    const job = ImprovementJob.create(uuidv4(), slug.getValue(), filePath);
    await this.jobRepository.save(job);

    this.logger.log(
      `Created improvement job ${job.id} for ${filePath} in ${slug.getValue()}`,
    );

    return this.toDto(job);
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
