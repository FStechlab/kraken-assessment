import {
  IsString,
  IsNotEmpty,
  Matches,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

export class AnalyzeCoverageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, {
    message: 'repositorySlug must be in the format "owner/repo"',
  })
  repositorySlug!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  threshold?: number;
}

export class StartImprovementDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, {
    message: 'repositorySlug must be in the format "owner/repo"',
  })
  repositorySlug!: string;

  @IsString()
  @IsNotEmpty()
  filePath!: string;
}
