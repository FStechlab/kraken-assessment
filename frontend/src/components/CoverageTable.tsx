import { CoverageFileDto } from "../services/api";

interface CoverageBarProps {
  value: number;
  threshold: number;
  size?: "sm" | "md";
}

function CoverageBar({ value, threshold, size = "md" }: CoverageBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct >= threshold
      ? "#22c55e"
      : pct >= threshold * 0.6
        ? "#f59e0b"
        : "#ef4444";
  const height = size === "sm" ? "6px" : "10px";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          flex: 1,
          height,
          background: "#e5e7eb",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "999px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: size === "sm" ? "11px" : "13px",
          fontWeight: 600,
          color,
          minWidth: "40px",
          textAlign: "right",
        }}
      >
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

interface CoverageTableProps {
  files: CoverageFileDto[];
  threshold: number;
  repositorySlug: string;
  onImprove: (filePath: string) => void;
  improvingFiles: Set<string>;
}

export function CoverageTable({
  files,
  threshold,
  repositorySlug: _repositorySlug,
  onImprove,
  improvingFiles,
}: CoverageTableProps) {
  const sorted = [...files].sort((a, b) => a.lineCoverage - b.lineCoverage);

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={thStyle}>File</th>
            <th style={{ ...thStyle, width: "180px" }}>Line Coverage</th>
            <th style={{ ...thStyle, width: "120px" }}>Functions</th>
            <th style={{ ...thStyle, width: "120px" }}>Branches</th>
            <th style={{ ...thStyle, width: "100px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((file) => (
            <tr
              key={file.filePath}
              style={{
                borderBottom: "1px solid #f3f4f6",
                background: file.needsImprovement ? "#fff7f7" : "transparent",
              }}
            >
              <td style={tdStyle}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    wordBreak: "break-all",
                  }}
                >
                  {file.filePath}
                </span>
                {file.needsImprovement && (
                  <span
                    style={{
                      marginLeft: "6px",
                      background: "#fee2e2",
                      color: "#dc2626",
                      fontSize: "10px",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      fontWeight: 600,
                    }}
                  >
                    LOW
                  </span>
                )}
              </td>
              <td style={tdStyle}>
                <CoverageBar value={file.lineCoverage} threshold={threshold} />
              </td>
              <td style={tdStyle}>
                <CoverageBar
                  value={file.functionCoverage}
                  threshold={threshold}
                  size="sm"
                />
              </td>
              <td style={tdStyle}>
                <CoverageBar
                  value={file.branchCoverage}
                  threshold={threshold}
                  size="sm"
                />
              </td>
              <td style={tdStyle}>
                {file.needsImprovement && (
                  <button
                    onClick={() => onImprove(file.filePath)}
                    disabled={improvingFiles.has(file.filePath)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      background: improvingFiles.has(file.filePath)
                        ? "#9ca3af"
                        : "#6366f1",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: improvingFiles.has(file.filePath)
                        ? "not-allowed"
                        : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {improvingFiles.has(file.filePath)
                      ? "⏳ Queued"
                      : "✨ Improve"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontWeight: 600,
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
};
