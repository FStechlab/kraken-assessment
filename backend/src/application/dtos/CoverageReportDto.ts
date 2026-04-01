export interface CoverageFileDto {
  filePath: string;
  lineCoverage: number;
  statementCoverage: number;
  functionCoverage: number;
  branchCoverage: number;
  needsImprovement: boolean;
  metrics: {
    lines: { total: number; covered: number };
    statements: { total: number; covered: number };
    functions: { total: number; covered: number };
    branches: { total: number; covered: number };
  };
}

export interface CoverageReportDto {
  repositorySlug: string;
  overallLineCoverage: number;
  analyzedAt: string;
  commitSha: string;
  files: CoverageFileDto[];
  threshold: number;
}
