import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { AnalyzeCoverageUseCase } from "../../../application/use-cases/AnalyzeCoverageUseCase";
import { AnalyzeCoverageDto } from "../dtos/RequestDtos";

@Controller("api/coverage")
export class CoverageController {
  constructor(
    private readonly analyzeCoverageUseCase: AnalyzeCoverageUseCase,
  ) {}

  @Post("analyze")
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() dto: AnalyzeCoverageDto) {
    try {
      return await this.analyzeCoverageUseCase.execute(
        dto.repositorySlug,
        dto.threshold,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(message);
    }
  }

  @Get(":owner/:repo")
  async getCoverage(
    @Param("owner") owner: string,
    @Param("repo") repo: string,
    @Query("threshold") threshold?: string,
  ) {
    const thresholdNum = threshold ? parseFloat(threshold) : undefined;
    const report = await this.analyzeCoverageUseCase.getLatest(
      `${owner}/${repo}`,
      thresholdNum,
    );
    if (!report) {
      throw new NotFoundException(
        `No coverage report found for ${owner}/${repo}. Run /api/coverage/analyze first.`,
      );
    }
    return report;
  }

  @Get("repositories/list")
  async listRepositories() {
    // This is injected via use-case but we need the repository here
    // Use a simpler approach: forward to the use-case
    return { message: "Use GET /api/coverage/:owner/:repo per repository" };
  }
}
