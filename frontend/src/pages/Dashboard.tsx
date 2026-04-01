import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coverageApi, jobsApi, CoverageReportDto } from "../services/api";
import { CoverageTable } from "../components/CoverageTable";
import { JobProgressPanel } from "../components/JobProgressPanel";

export function Dashboard() {
  const [repoInput, setRepoInput] = useState("");
  const [threshold, setThreshold] = useState(80);
  const [activeRepo, setActiveRepo] = useState<string | null>(null);
  const [improvingFiles, setImprovingFiles] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch existing coverage report
  const { data: report, isFetching: isFetchingReport } =
    useQuery<CoverageReportDto>({
      queryKey: ["coverage", activeRepo, threshold],
      queryFn: () => {
        const [owner, repo] = activeRepo!.split("/");
        return coverageApi.getReport(owner, repo, threshold);
      },
      enabled: !!activeRepo,
      retry: false,
      refetchOnWindowFocus: false,
    });

  // Fetch all jobs for the active repo
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs", activeRepo],
    queryFn: () => jobsApi.listJobs(activeRepo ?? undefined),
    enabled: !!activeRepo,
    refetchInterval: (query) => {
      const data = query.state.data ?? [];
      const hasActive = data.some((j) =>
        [
          "PENDING",
          "CLONING",
          "ANALYZING",
          "GENERATING",
          "SUBMITTING",
        ].includes(j.status),
      );
      return hasActive ? 3000 : false;
    },
  });

  // Analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: ({ slug, t }: { slug: string; t: number }) =>
      coverageApi.analyze(slug, t),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["coverage", data.repositorySlug, threshold],
        data,
      );
      setActiveRepo(data.repositorySlug);
    },
  });

  // Improve mutation
  const improveMutation = useMutation({
    mutationFn: ({
      repositorySlug,
      filePath,
    }: {
      repositorySlug: string;
      filePath: string;
    }) => jobsApi.startImprovement(repositorySlug, filePath),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", job.repositorySlug] });
      setImprovingFiles((prev) => {
        const next = new Set(prev);
        next.add(job.filePath);
        return next;
      });
    },
  });

  const handleAnalyze = useCallback(() => {
    const slug = repoInput.trim();
    if (!slug.match(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)) {
      alert("Enter a valid repository slug in format: owner/repo");
      return;
    }
    analyzeMutation.mutate({ slug, t: threshold });
  }, [repoInput, threshold, analyzeMutation]);

  const handleImprove = useCallback(
    (filePath: string) => {
      if (!activeRepo) return;
      improveMutation.mutate({ repositorySlug: activeRepo, filePath });
    },
    [activeRepo, improveMutation],
  );

  const activeJobs = activeRepo
    ? jobs.filter((j) => j.repositorySlug === activeRepo)
    : [];

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 4px",
          }}
        >
          🧪 TS Coverage Improver
        </h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
          Analyze TypeScript test coverage and auto-generate tests via AI pull
          requests
        </p>
      </div>

      {/* Analyze form */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#374151",
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          Analyze Repository
        </h2>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={labelStyle}>GitHub Repository (owner/repo)</label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="e.g. microsoft/typescript-samples"
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              style={inputStyle}
            />
          </div>
          <div style={{ minWidth: "120px" }}>
            <label style={labelStyle}>Threshold (%)</label>
            <input
              type="number"
              value={threshold}
              min={0}
              max={100}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              style={{ ...inputStyle, width: "80px" }}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            style={primaryButtonStyle}
          >
            {analyzeMutation.isPending ? "⏳ Analyzing…" : "🔍 Analyze"}
          </button>
        </div>
        {analyzeMutation.isError && (
          <div style={errorBoxStyle}>
            {(analyzeMutation.error as Error)?.message ?? "Analysis failed"}
          </div>
        )}
      </div>

      {/* Coverage Report */}
      {(report || isFetchingReport) && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#374151",
                margin: 0,
              }}
            >
              Coverage Report
              {report && (
                <span
                  style={{
                    marginLeft: "8px",
                    fontSize: "13px",
                    color: "#6b7280",
                    fontWeight: 400,
                  }}
                >
                  {report.repositorySlug} · commit{" "}
                  <code>{report.commitSha.slice(0, 7)}</code>
                </span>
              )}
            </h2>
            {report && (
              <div style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
                <StatPill
                  label="Overall"
                  value={report.overallLineCoverage}
                  threshold={threshold}
                />
                <StatPill
                  label="Files below threshold"
                  value={report.files.filter((f) => f.needsImprovement).length}
                  isCount
                />
              </div>
            )}
          </div>

          {isFetchingReport && !report ? (
            <div
              style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}
            >
              Loading…
            </div>
          ) : report ? (
            <CoverageTable
              files={report.files}
              threshold={threshold}
              repositorySlug={report.repositorySlug}
              onImprove={handleImprove}
              improvingFiles={improvingFiles}
            />
          ) : null}
        </div>
      )}

      {/* Jobs Panel */}
      {activeRepo && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#374151",
              marginTop: 0,
              marginBottom: "16px",
            }}
          >
            Improvement Jobs
            {activeJobs.length > 0 && (
              <span
                style={{
                  marginLeft: "8px",
                  background: "#e0e7ff",
                  color: "#4f46e5",
                  fontSize: "12px",
                  padding: "1px 7px",
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                {activeJobs.length}
              </span>
            )}
          </h2>
          <JobProgressPanel jobs={activeJobs} />
        </div>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  threshold,
  isCount,
}: {
  label: string;
  value: number;
  threshold?: number;
  isCount?: boolean;
}) {
  const color = isCount
    ? value > 0
      ? "#dc2626"
      : "#16a34a"
    : threshold !== undefined && value >= threshold
      ? "#16a34a"
      : "#dc2626";

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "20px", fontWeight: 700, color }}>
        {isCount ? value : `${value.toFixed(1)}%`}
      </div>
      <div style={{ color: "#9ca3af", fontSize: "11px" }}>{label}</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "8px 20px",
  background: "#6366f1",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  height: "38px",
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: "12px",
  padding: "10px 14px",
  background: "#fef2f2",
  color: "#dc2626",
  borderRadius: "6px",
  fontSize: "13px",
};
