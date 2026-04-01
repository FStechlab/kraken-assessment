import { GetImprovementJobUseCase } from "./GetImprovementJobUseCase";
import { IImprovementJobRepository } from "../../domain/improvement-job/repositories/IImprovementJobRepository";
import { ImprovementJob } from "../../domain/improvement-job/entities/ImprovementJob";

const makeJob = (id: string, slug: string, filePath: string) =>
  ImprovementJob.create(id, slug, filePath);

describe("GetImprovementJobUseCase", () => {
  let mockRepo: jest.Mocked<IImprovementJobRepository>;
  let useCase: GetImprovementJobUseCase;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRepositorySlug: jest.fn(),
      findPendingJobs: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new GetImprovementJobUseCase(mockRepo);
  });

  describe("findById", () => {
    it("returns a DTO when the job exists", async () => {
      const job = makeJob("job-1", "owner/repo", "src/foo.ts");
      mockRepo.findById.mockResolvedValue(job);

      const result = await useCase.findById("job-1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("job-1");
      expect(result!.repositorySlug).toBe("owner/repo");
      expect(result!.filePath).toBe("src/foo.ts");
      expect(result!.status).toBe("PENDING");
      expect(result!.pullRequestUrl).toBeNull();
    });

    it("returns null when the job does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await useCase.findById("missing");
      expect(result).toBeNull();
    });

    it("delegates to the repository with the given id", async () => {
      mockRepo.findById.mockResolvedValue(null);
      await useCase.findById("abc-123");
      expect(mockRepo.findById).toHaveBeenCalledWith("abc-123");
    });
  });

  describe("findByRepositorySlug", () => {
    it("returns DTOs for all jobs under the slug", async () => {
      mockRepo.findByRepositorySlug.mockResolvedValue([
        makeJob("j1", "owner/repo", "src/a.ts"),
        makeJob("j2", "owner/repo", "src/b.ts"),
      ]);

      const result = await useCase.findByRepositorySlug("owner/repo");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("j1");
      expect(result[1].id).toBe("j2");
    });

    it("returns an empty array when no jobs exist", async () => {
      mockRepo.findByRepositorySlug.mockResolvedValue([]);
      const result = await useCase.findByRepositorySlug("owner/repo");
      expect(result).toEqual([]);
    });
  });

  describe("findAll", () => {
    it("returns DTOs for every job", async () => {
      mockRepo.findAll.mockResolvedValue([
        makeJob("j1", "owner/repo", "src/a.ts"),
        makeJob("j2", "other/lib", "src/b.ts"),
      ]);

      const result = await useCase.findAll();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toEqual(["j1", "j2"]);
    });

    it("includes ISO date strings for createdAt and updatedAt", async () => {
      mockRepo.findAll.mockResolvedValue([makeJob("j1", "o/r", "src/a.ts")]);
      const [dto] = await useCase.findAll();
      expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
