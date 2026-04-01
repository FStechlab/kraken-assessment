import { RepositorySlug } from "./RepositorySlug";

describe("RepositorySlug", () => {
  describe("create", () => {
    it("parses a valid owner/repo string", () => {
      const slug = RepositorySlug.create("microsoft/vscode");
      expect(slug.owner).toBe("microsoft");
      expect(slug.repo).toBe("vscode");
    });

    it("returns the correct getValue()", () => {
      expect(RepositorySlug.create("microsoft/vscode").getValue()).toBe(
        "microsoft/vscode",
      );
    });

    it("throws for a string without a slash", () => {
      expect(() => RepositorySlug.create("invalidslug")).toThrow(
        "Invalid repository slug",
      );
    });

    it("throws when owner is empty", () => {
      expect(() => RepositorySlug.create("/repo")).toThrow(
        "Invalid repository slug",
      );
    });

    it("throws when repo is empty", () => {
      expect(() => RepositorySlug.create("owner/")).toThrow(
        "Invalid repository slug",
      );
    });

    it("throws when there are more than two parts", () => {
      expect(() => RepositorySlug.create("owner/repo/extra")).toThrow(
        "Invalid repository slug",
      );
    });
  });

  describe("fromOwnerAndRepo", () => {
    it("builds a slug from owner and repo", () => {
      const slug = RepositorySlug.fromOwnerAndRepo("facebook", "react");
      expect(slug.getValue()).toBe("facebook/react");
    });

    it("throws when owner is empty", () => {
      expect(() => RepositorySlug.fromOwnerAndRepo("", "repo")).toThrow(
        "Owner and repo cannot be empty",
      );
    });

    it("throws when repo is empty", () => {
      expect(() => RepositorySlug.fromOwnerAndRepo("owner", "")).toThrow(
        "Owner and repo cannot be empty",
      );
    });
  });

  describe("equals", () => {
    it("returns true for identical slugs", () => {
      const a = RepositorySlug.create("owner/repo");
      const b = RepositorySlug.create("owner/repo");
      expect(a.equals(b)).toBe(true);
    });

    it("returns false for different repos", () => {
      const a = RepositorySlug.create("owner/repo-a");
      const b = RepositorySlug.create("owner/repo-b");
      expect(a.equals(b)).toBe(false);
    });

    it("returns false for different owners", () => {
      const a = RepositorySlug.create("owner-a/repo");
      const b = RepositorySlug.create("owner-b/repo");
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("toString", () => {
    it("returns the same as getValue()", () => {
      const slug = RepositorySlug.create("google/gson");
      expect(slug.toString()).toBe("google/gson");
    });
  });
});
