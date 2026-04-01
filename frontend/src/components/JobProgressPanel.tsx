import { ImprovementJobDto } from "../services/api";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: "Pending", color: "#6b7280", bg: "#f3f4f6" },
  CLONING: { label: "⬇ Cloning", color: "#2563eb", bg: "#eff6ff" },
  ANALYZING: { label: "🔍 Analyzing", color: "#7c3aed", bg: "#f5f3ff" },
  GENERATING: { label: "🤖 Generating", color: "#d97706", bg: "#fffbeb" },
  SUBMITTING: { label: "📤 Submitting", color: "#0891b2", bg: "#ecfeff" },
  COMPLETED: { label: "✅ Completed", color: "#16a34a", bg: "#f0fdf4" },
  FAILED: { label: "❌ Failed", color: "#dc2626", bg: "#fef2f2" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "#6b7280",
    bg: "#f3f4f6",
  };
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

interface JobProgressPanelProps {
  jobs: ImprovementJobDto[];
}

export function JobProgressPanel({ jobs }: JobProgressPanelProps) {
  if (jobs.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "#9ca3af",
          fontSize: "14px",
        }}
      >
        No improvement jobs yet. Click "✨ Improve" on a file below to start.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {jobs.map((job) => (
        <div
          key={job.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "14px 16px",
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                {job.filePath}
              </div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                {job.repositorySlug} ·{" "}
                {new Date(job.createdAt).toLocaleString()}
              </div>
            </div>
            <StatusBadge status={job.status} />
          </div>

          {job.pullRequestUrl && (
            <div style={{ marginTop: "10px" }}>
              <a
                href={job.pullRequestUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  background: "#24292f",
                  color: "#fff",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                🔗 View PR #{job.pullRequestNumber}
              </a>
            </div>
          )}

          {job.branchName && job.status !== "COMPLETED" && (
            <div
              style={{ marginTop: "8px", fontSize: "11px", color: "#6b7280" }}
            >
              Branch: <code>{job.branchName}</code>
            </div>
          )}

          {job.errorMessage && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px",
                background: "#fef2f2",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#dc2626",
                fontFamily: "monospace",
                wordBreak: "break-word",
              }}
            >
              {job.errorMessage}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
