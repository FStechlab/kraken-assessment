import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IImprovementJobRepository } from "../../../../domain/improvement-job/repositories/IImprovementJobRepository";
import { ImprovementJob } from "../../../../domain/improvement-job/entities/ImprovementJob";
import { ImprovementJobOrmEntity } from "../orm-entities/ImprovementJobOrmEntity";

@Injectable()
export class ImprovementJobSqliteRepository implements IImprovementJobRepository {
  constructor(
    @InjectRepository(ImprovementJobOrmEntity)
    private readonly ormRepo: Repository<ImprovementJobOrmEntity>,
  ) {}

  async save(job: ImprovementJob): Promise<void> {
    const entity = new ImprovementJobOrmEntity();
    entity.id = job.id;
    entity.repositorySlug = job.repositorySlug;
    entity.filePath = job.filePath.getValue();
    entity.status = job.status.toString();
    entity.pullRequestUrl = job.pullRequestUrl;
    entity.pullRequestNumber = job.pullRequestNumber;
    entity.branchName = job.branchName;
    entity.errorMessage = job.errorMessage;
    await this.ormRepo.save(entity);
  }

  async findById(id: string): Promise<ImprovementJob | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRepositorySlug(
    repositorySlug: string,
  ): Promise<ImprovementJob[]> {
    const entities = await this.ormRepo.find({
      where: { repositorySlug },
      order: { createdAt: "DESC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findPendingJobs(): Promise<ImprovementJob[]> {
    const entities = await this.ormRepo.find({
      where: { status: "PENDING" },
      order: { createdAt: "ASC" },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAll(): Promise<ImprovementJob[]> {
    const entities = await this.ormRepo.find({ order: { createdAt: "DESC" } });
    return entities.map((e) => this.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete({ id });
  }

  private toDomain(entity: ImprovementJobOrmEntity): ImprovementJob {
    return ImprovementJob.reconstitute({
      id: entity.id,
      repositorySlug: entity.repositorySlug,
      filePath: entity.filePath,
      status: entity.status,
      pullRequestUrl: entity.pullRequestUrl,
      pullRequestNumber: entity.pullRequestNumber,
      branchName: entity.branchName,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
