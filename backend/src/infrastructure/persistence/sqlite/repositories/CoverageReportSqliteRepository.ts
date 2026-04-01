import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ICoverageReportRepository } from "../../../../domain/coverage/repositories/ICoverageReportRepository";
import { CoverageReport } from "../../../../domain/coverage/entities/CoverageReport";
import { CoverageFile } from "../../../../domain/coverage/entities/CoverageFile";
import { CoverageFileOrmEntity } from "../orm-entities/CoverageFileOrmEntity";

@Injectable()
export class CoverageReportSqliteRepository implements ICoverageReportRepository {
  constructor(
    @InjectRepository(CoverageFileOrmEntity)
    private readonly ormRepo: Repository<CoverageFileOrmEntity>,
  ) {}

  async save(report: CoverageReport): Promise<void> {
    // Remove old entries for this repo
    await this.ormRepo.delete({ repositorySlug: report.repositorySlug });

    const entities = report.files.map((f) => {
      const entity = new CoverageFileOrmEntity();
      entity.id = uuidv4();
      entity.repositorySlug = report.repositorySlug;
      entity.filePath = f.filePath.getValue();
      entity.commitSha = report.commitSha;
      entity.linesPct = f.metrics.lines.pct;
      entity.linesTotal = f.metrics.lines.total;
      entity.linesCovered = f.metrics.lines.covered;
      entity.statementsPct = f.metrics.statements.pct;
      entity.statementsTotal = f.metrics.statements.total;
      entity.statementsCovered = f.metrics.statements.covered;
      entity.functionsPct = f.metrics.functions.pct;
      entity.functionsTotal = f.metrics.functions.total;
      entity.functionsCovered = f.metrics.functions.covered;
      entity.branchesPct = f.metrics.branches.pct;
      entity.branchesTotal = f.metrics.branches.total;
      entity.branchesCovered = f.metrics.branches.covered;
      return entity;
    });

    await this.ormRepo.save(entities);
  }

  async findLatestByRepositorySlug(
    repositorySlug: string,
  ): Promise<CoverageReport | null> {
    const entities = await this.ormRepo.find({ where: { repositorySlug } });
    if (entities.length === 0) return null;

    const files = entities.map((e) =>
      CoverageFile.create(
        e.filePath,
        {
          lines: {
            total: e.linesTotal,
            covered: e.linesCovered,
            pct: e.linesPct,
          },
          statements: {
            total: e.statementsTotal,
            covered: e.statementsCovered,
            pct: e.statementsPct,
          },
          functions: {
            total: e.functionsTotal,
            covered: e.functionsCovered,
            pct: e.functionsPct,
          },
          branches: {
            total: e.branchesTotal,
            covered: e.branchesCovered,
            pct: e.branchesPct,
          },
        },
        repositorySlug,
      ),
    );

    return CoverageReport.create(
      repositorySlug,
      files,
      entities[0].commitSha,
      entities[0].analyzedAt,
    );
  }

  async findAllRepositorySlugs(): Promise<string[]> {
    const results = await this.ormRepo
      .createQueryBuilder("cf")
      .select("DISTINCT cf.repositorySlug", "slug")
      .getRawMany<{ slug: string }>();
    return results.map((r) => r.slug);
  }

  async delete(repositorySlug: string): Promise<void> {
    await this.ormRepo.delete({ repositorySlug });
  }
}
