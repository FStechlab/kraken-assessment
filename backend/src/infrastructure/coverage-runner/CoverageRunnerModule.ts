import { Module } from "@nestjs/common";
import { JestCoverageRunnerAdapter } from "./JestCoverageRunnerAdapter";
import { COVERAGE_RUNNER_PORT } from "../../application/ports/ICoverageRunnerPort";

@Module({
  providers: [
    JestCoverageRunnerAdapter,
    { provide: COVERAGE_RUNNER_PORT, useExisting: JestCoverageRunnerAdapter },
  ],
  exports: [COVERAGE_RUNNER_PORT],
})
export class CoverageRunnerModule {}
