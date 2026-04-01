# TS Coverage Improver

A NestJS service that automatically improves TypeScript test coverage in GitHub repositories by generating `*.test.ts` files via OpenAI and submitting them as pull requests.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Domain Glossary](#domain-glossary)
3. [Prerequisites](#prerequisites)
4. [Setup & Installation](#setup--installation)
5. [Running the Application](#running-the-application)
6. [API Reference](#api-reference)
7. [How It Works — Step by Step](#how-it-works--step-by-step)
8. [Assumptions & Limitations](#assumptions--limitations)

---

## Architecture Overview

The backend follows **Domain-Driven Design (DDD)** with four layers:

```
┌──────────────────────────────────────────────────────────────┐
│  Presentation Layer  (NestJS controllers, HTTP DTOs)          │
├──────────────────────────────────────────────────────────────┤
│  Application Layer   (Use Cases, Port interfaces)             │
├──────────────────────────────────────────────────────────────┤
│  Domain Layer        (Entities, Value Objects, Repo ifaces)    │
├──────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (TypeORM/SQLite, Octokit, OpenAI, Git)  │
└──────────────────────────────────────────────────────────────┘
```

### Layer responsibilities

| Layer              | Contents                                                                                                                                               | Framework dependency                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **Domain**         | `CoverageFile`, `CoverageReport`, `ImprovementJob`, value objects, repository interfaces                                                               | None                                     |
| **Application**    | `AnalyzeCoverageUseCase`, `StartImprovementUseCase`, `GetImprovementJobUseCase`, port interfaces                                                       | NestJS `@Injectable` only                |
| **Infrastructure** | TypeORM entities, SQLite repositories, `GitHubAdapter` (Octokit), `OpenAiTestGeneratorAdapter`, `JestCoverageRunnerAdapter`, `ImprovementJobProcessor` | TypeORM, Octokit, OpenAI SDK, simple-git |
| **Presentation**   | NestJS controllers, `AppModule`                                                                                                                        | NestJS, class-validator                  |

### Component Diagram

```
Browser (React)
     │  HTTP
     ▼
CoverageController          ImprovementJobController
     │                              │
     ▼                              ▼
AnalyzeCoverageUseCase    StartImprovementUseCase
     │                    GetImprovementJobUseCase
     │                              │
     └──────────┬───────────────────┘
                │
     ┌──────────▼──────────────────────────────┐
     │          Domain                          │
     │  CoverageReport  ImprovementJob          │
     └──────────┬──────────────────────────────┘
                │
     ┌──────────▼──────────────────────────────┐
     │        Infrastructure                    │
     │  SQLite  │  GitHub  │  OpenAI  │  Git    │
     └──────────────────────────────────────────┘
                │
     ImprovementJobProcessor  (cron every 10s)
         1. Clone repo
         2. Run jest --coverage
         3. Call OpenAI for test generation
         4. Git push new branch
         5. Create GitHub PR
```

---

## Domain Glossary

| Term                    | Definition                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Repository Slug**     | A GitHub repo identifier in `owner/repo` format (e.g. `microsoft/vscode`). Value Object.                                                        |
| **Coverage File**       | A TypeScript source file tracked with its coverage metrics (lines, statements, functions, branches). Entity.                                    |
| **Coverage Report**     | Snapshot of all tracked files for a repo at a given commit SHA. Aggregate Root.                                                                 |
| **Coverage Percentage** | A value object wrapping a 0–100 number representing a coverage metric.                                                                          |
| **Improvement Job**     | A background work unit that clones a repo, generates AI tests for a specific file, and opens a GitHub PR. Entity / Aggregate Root.              |
| **Job Status**          | Value object representing the lifecycle stage of an `ImprovementJob`: `PENDING → CLONING → ANALYZING → GENERATING → SUBMITTING → COMPLETED      | FAILED`. |
| **Coverage Threshold**  | The minimum acceptable line-coverage percentage (default 80%). Files below this are flagged.                                                    |
| **AI Test Generator**   | Infrastructure port (implemented by `OpenAiTestGeneratorAdapter`) that receives source + coverage context and returns generated Jest test code. |
| **Coverage Runner**     | Infrastructure port (implemented by `JestCoverageRunnerAdapter`) that clones a repo, runs `jest --coverage`, and parses results.                |

---

## Prerequisites

| Requirement                      | Notes                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Node.js ≥ 20**                 | `node --version`                                                                                            |
| **npm ≥ 10**                     | Bundled with Node 20                                                                                        |
| **GitHub Personal Access Token** | Needs `repo` scope (full read/write). [Create one here](https://github.com/settings/tokens/new?scopes=repo) |
| **OpenAI API Key**               | [Get one here](https://platform.openai.com/api-keys)                                                        |
| **Git**                          | Available on `$PATH`                                                                                        |

The target GitHub repository must:

- Be a TypeScript project
- Have **Jest** configured (either in `jest.config.*` or `package.json → jest`)
- Have `npm install` as its install command

---

## Setup & Installation

### 1. Clone and configure environment

```bash
git clone <this-repo>
cd kraken-assessment

# Copy environment template
cp .env.example backend/.env

# Edit with your credentials
nano backend/.env
```

Minimum required values in `backend/.env`:

```env
GITHUB_TOKEN=ghp_your_token_here
OPENAI_API_KEY=sk-your_key_here
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the Application

### Development mode (hot-reload)

**Terminal 1 — Backend:**

```bash
cd backend
npm run start:dev
# → http://localhost:3000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build

```bash
# Build backend
cd backend && npm run build
node dist/main

# Build frontend
cd frontend && npm run build
# Serve dist/ with any static server
```

---

## API Reference

### Coverage

| Method | Path                         | Description                                          |
| ------ | ---------------------------- | ---------------------------------------------------- |
| `POST` | `/api/coverage/analyze`      | Clone repo, run jest, store & return coverage report |
| `GET`  | `/api/coverage/:owner/:repo` | Return the last cached coverage report               |

**POST `/api/coverage/analyze`**

```json
{
  "repositorySlug": "owner/repo",
  "threshold": 80
}
```

**Response:**

```json
{
  "repositorySlug": "owner/repo",
  "overallLineCoverage": 64.3,
  "analyzedAt": "2026-04-01T10:00:00.000Z",
  "commitSha": "abc1234...",
  "threshold": 80,
  "files": [
    {
      "filePath": "src/utils/calculator.ts",
      "lineCoverage": 42.5,
      "functionCoverage": 33.3,
      "branchCoverage": 50.0,
      "statementCoverage": 44.1,
      "needsImprovement": true,
      "metrics": { ... }
    }
  ]
}
```

### Improvement Jobs

| Method | Path            | Description                                            |
| ------ | --------------- | ------------------------------------------------------ |
| `POST` | `/api/jobs`     | Create and enqueue an improvement job                  |
| `GET`  | `/api/jobs`     | List all jobs (filter by `?repositorySlug=owner/repo`) |
| `GET`  | `/api/jobs/:id` | Get single job by ID                                   |

**POST `/api/jobs`**

```json
{
  "repositorySlug": "owner/repo",
  "filePath": "src/utils/calculator.ts"
}
```

**Response:**

```json
{
  "id": "uuid",
  "repositorySlug": "owner/repo",
  "filePath": "src/utils/calculator.ts",
  "status": "PENDING",
  "pullRequestUrl": null,
  "pullRequestNumber": null,
  "branchName": null,
  "errorMessage": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## How It Works — Step by Step

1. **User enters** a GitHub repo slug (`owner/repo`) in the dashboard and clicks **Analyze**.

2. **Backend** (`AnalyzeCoverageUseCase`):
   - Fetches repo info from GitHub API
   - Clones the repo to a temp directory using `simple-git`
   - Runs `npm install` then `npx jest --coverage --coverageReporters=json-summary --coverageReporters=json`
   - Parses `coverage/coverage-summary.json` and `coverage/coverage-final.json`
   - Persists results to SQLite
   - Returns coverage data to frontend

3. **Frontend** renders a table of all TypeScript source files with coverage bars. Files below the threshold show an **✨ Improve** button.

4. **User clicks Improve** on a low-coverage file.

5. **Backend** (`StartImprovementUseCase`) creates an `ImprovementJob` record in SQLite with status `PENDING`.

6. **`ImprovementJobProcessor`** (cron every 10 seconds):
   - Picks up `PENDING` jobs (one per repo at a time to avoid conflicts)
   - **CLONING**: Clones repo fresh to a new temp directory
   - **ANALYZING**: Re-runs jest coverage; extracts uncovered lines & function names from `coverage-final.json`
   - **GENERATING**: Calls OpenAI API with the source file, existing tests, and uncovered lines → receives generated test code
   - **SUBMITTING**:
     - Writes the generated `.test.ts` file to the working directory
     - Creates a new git branch `coverage-improvement/{filename}-{timestamp}`
     - Commits and pushes to GitHub
     - Creates a Pull Request via GitHub API
   - Updates job to `COMPLETED` with PR URL, or `FAILED` with error message

7. **Frontend** polls job status every 3 seconds while jobs are in progress and displays the PR link when complete.

---

## Assumptions & Limitations

- Target repositories must use **Jest** as the test runner
- Dependencies installed via **npm** (`npm install`)
- The provided `GITHUB_TOKEN` must have **push access** to the target repository (or you must fork first)
- Coverage analysis clones the repo each time (no caching between analysis runs)
- AI-generated tests are a **starting point** — they should be reviewed before merging
- Only one improvement job per repository runs at a time (serialized with an in-memory lock)
- The OpenAI model's context window limits test generation for very large files; files >4000 lines may be truncated
