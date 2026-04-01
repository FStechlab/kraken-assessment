import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { StartImprovementUseCase } from "../../../application/use-cases/StartImprovementUseCase";
import { GetImprovementJobUseCase } from "../../../application/use-cases/GetImprovementJobUseCase";
import { StartImprovementDto } from "../dtos/RequestDtos";

@Controller("api/jobs")
export class ImprovementJobController {
  constructor(
    private readonly startImprovementUseCase: StartImprovementUseCase,
    private readonly getImprovementJobUseCase: GetImprovementJobUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async startImprovement(@Body() dto: StartImprovementDto) {
    try {
      return await this.startImprovementUseCase.execute(
        dto.repositorySlug,
        dto.filePath,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(message);
    }
  }

  @Get()
  async listAllJobs(@Query("repositorySlug") repositorySlug?: string) {
    if (repositorySlug) {
      return this.getImprovementJobUseCase.findByRepositorySlug(repositorySlug);
    }
    return this.getImprovementJobUseCase.findAll();
  }

  @Get(":id")
  async getJob(@Param("id") id: string) {
    const job = await this.getImprovementJobUseCase.findById(id);
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return job;
  }
}
