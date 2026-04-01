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
