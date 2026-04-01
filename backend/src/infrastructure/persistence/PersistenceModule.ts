import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CoverageFileOrmEntity } from "./sqlite/orm-entities/CoverageFileOrmEntity";
import { ImprovementJobOrmEntity } from "./sqlite/orm-entities/ImprovementJobOrmEntity";
import { CoverageReportSqliteRepository } from "./sqlite/repositories/CoverageReportSqliteRepository";
import { ImprovementJobSqliteRepository } from "./sqlite/repositories/ImprovementJobSqliteRepository";
import { COVERAGE_REPORT_REPOSITORY } from "../../domain/coverage/repositories/ICoverageReportRepository";
import { IMPROVEMENT_JOB_REPOSITORY } from "../../domain/improvement-job/repositories/IImprovementJobRepository";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "better-sqlite3",
        database: config.get<string>(
          "SQLITE_DATABASE_PATH",
          "data/coverage.db",
        ),
        entities: [CoverageFileOrmEntity, ImprovementJobOrmEntity],
        synchronize: true,
        logging: config.get<string>("NODE_ENV") === "development",
      }),
    }),
    TypeOrmModule.forFeature([CoverageFileOrmEntity, ImprovementJobOrmEntity]),
  ],
  providers: [
    CoverageReportSqliteRepository,
    ImprovementJobSqliteRepository,
    {
      provide: COVERAGE_REPORT_REPOSITORY,
      useExisting: CoverageReportSqliteRepository,
    },
    {
      provide: IMPROVEMENT_JOB_REPOSITORY,
      useExisting: ImprovementJobSqliteRepository,
    },
  ],
  exports: [COVERAGE_REPORT_REPOSITORY, IMPROVEMENT_JOB_REPOSITORY],
})
export class PersistenceModule {}
