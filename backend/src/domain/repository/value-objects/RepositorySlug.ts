export class RepositorySlug {
  private constructor(
    private readonly _owner: string,
    private readonly _repo: string,
  ) {}

  static create(slug: string): RepositorySlug {
    const parts = slug.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(
        `Invalid repository slug: "${slug}". Expected format: "owner/repo"`,
      );
    }
    return new RepositorySlug(parts[0], parts[1]);
  }

  static fromOwnerAndRepo(owner: string, repo: string): RepositorySlug {
    if (!owner || !repo) throw new Error("Owner and repo cannot be empty");
    return new RepositorySlug(owner, repo);
  }

  get owner(): string {
    return this._owner;
  }

  get repo(): string {
    return this._repo;
  }

  getValue(): string {
    return `${this._owner}/${this._repo}`;
  }

  equals(other: RepositorySlug): boolean {
    return this._owner === other._owner && this._repo === other._repo;
  }

  toString(): string {
    return this.getValue();
  }
}
