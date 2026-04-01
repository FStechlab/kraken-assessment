import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { PersistenceModule } from "../../infrastructure/persistence/PersistenceModule";
import { GitHubModule } from "../../infrastructure/github/GitHubModule";
import { AiModule } from "../../infrastructure/ai/AiModule";
import { CoverageRunnerModule } from "../../infrastructure/coverage-runner/CoverageRunnerModule";
import { JobProcessorModule } from "../../infrastructure/job-processor/JobProcessorModule";

import { AnalyzeCoverageUseCase } from "../../application/use-cases/AnalyzeCoverageUseCase";
import { StartImprovementUseCase } from "../../application/use-cases/StartImprovementUseCase";
import { GetImprovementJobUseCase } from "../../application/use-cases/GetImprovementJobUseCase";

import { CoverageController } from "../http/controllers/CoverageController";
import { ImprovementJobController } from "../http/controllers/ImprovementJobController";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PersistenceModule,
    GitHubModule,
    AiModule,
    CoverageRunnerModule,
    JobProcessorModule,
  ],
  providers: [
    AnalyzeCoverageUseCase,
    StartImprovementUseCase,
    GetImprovementJobUseCase,
  ],
  controllers: [CoverageController, ImprovementJobController],
})
export class AppModule {}
