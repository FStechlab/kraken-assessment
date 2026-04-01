import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { ImprovementJobProcessor } from "./ImprovementJobProcessor";
import { PersistenceModule } from "../persistence/PersistenceModule";
import { GitHubModule } from "../github/GitHubModule";
import { AiModule } from "../ai/AiModule";
import { CoverageRunnerModule } from "../coverage-runner/CoverageRunnerModule";

@Module({
  imports: [
    ScheduleModule,
    ConfigModule,
    PersistenceModule,
    GitHubModule,
    AiModule,
    CoverageRunnerModule,
  ],
  providers: [ImprovementJobProcessor],
})
export class JobProcessorModule {}
