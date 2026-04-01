import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

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

export interface ImprovementJobDto {
  id: string;
  repositorySlug: string;
  filePath: string;
  status: string;
  pullRequestUrl: string | null;
  pullRequestNumber: number | null;
  branchName: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const coverageApi = {
  analyze: (
    repositorySlug: string,
    threshold?: number,
  ): Promise<CoverageReportDto> =>
    api
      .post("/coverage/analyze", { repositorySlug, threshold })
      .then((r) => r.data),

  getReport: (
    owner: string,
    repo: string,
    threshold?: number,
  ): Promise<CoverageReportDto> =>
    api
      .get(`/coverage/${owner}/${repo}`, { params: { threshold } })
      .then((r) => r.data),
};

export const jobsApi = {
  startImprovement: (
    repositorySlug: string,
    filePath: string,
  ): Promise<ImprovementJobDto> =>
    api.post("/jobs", { repositorySlug, filePath }).then((r) => r.data),

  getJob: (id: string): Promise<ImprovementJobDto> =>
    api.get(`/jobs/${id}`).then((r) => r.data),

  listJobs: (repositorySlug?: string): Promise<ImprovementJobDto[]> =>
    api
      .get("/jobs", { params: repositorySlug ? { repositorySlug } : {} })
      .then((r) => r.data),
};
