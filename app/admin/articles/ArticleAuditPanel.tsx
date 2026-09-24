import { PrepareForReviewButton } from "./PrepareForReviewButton";
import { isResearchAuditFingerprintNote } from "../../../lib/research/article-audit-association";

export type AuditPanelArticle = {
  id: string;
  title: string;
  status: string;
  editorialScore?: number | null;
  editorialGrade?: string | null;
  qualityScore?: number | null;
  qualityGrade?: string | null;
  seoScore?: number | null;
  seoGrade?: string | null;
  category: string;
  researchAudits: Array<{
    id: string;
    createdAt: Date | string;
    publicationRecommendation?: string | null;
    researchConfidence?: number | null;
    averageAuthorityScore?: number | null;
    averageTrustScore?: number | null;
    averageVerificationScore?: number | null;
    consensusScore?: number | null;
    sourceQualityScore?: number | null;
    sourceCount?: number | null;
    evidenceCount?: number | null;
    factCount?: number | null;
    verifiedCount?: number | null;
    partiallyVerifiedCount?: number | null;
    unverifiedCount?: number | null;
    sources?: unknown;
    evidence?: unknown;
    facts?: unknown;
    consensus?: unknown;
  }>;
  reviewNotes: Array<{
    id: string;
    action: string;
    reviewer: string;
    note: string | null;
    createdAt: Date | string;
  }>;
};

export type AuditPanelState = {
  currentAudit: AuditPanelArticle["researchAudits"][number] | null;
  historicalAudits: AuditPanelArticle["researchAudits"];
};

function scoreColor(score?: number | null) {
  if ((score ?? 0) >= 80) return "#15803d";
  if ((score ?? 0) >= 60) return "#d97706";
  return "#b91c1c";
}

export function ArticleAuditPanel({
  article,
  currentAudit,
  historicalAudits,
}: {
  article: AuditPanelArticle;
  currentAudit: AuditPanelState["currentAudit"];
  historicalAudits: AuditPanelState["historicalAudits"];
}) {
  const humanReviewNotes = article.reviewNotes.filter(
    (note) => !isResearchAuditFingerprintNote(note),
  );

  return (
    <div>
      <h1 style={{ marginTop: "20px" }}>Executive Article Audit</h1>
      <h2>{article.title}</h2>

      <div style={grid}>
        <Metric
          label="Editorial Score"
          value={scoreDisplayValue(
            Boolean(currentAudit),
            historicalAudits.length,
            article.editorialScore,
          )}
        />
        <Metric
          label="Quality Score"
          value={scoreDisplayValue(
            Boolean(currentAudit),
            historicalAudits.length,
            article.qualityScore,
          )}
        />
        <Metric
          label="SEO Score"
          value={scoreDisplayValue(
            Boolean(currentAudit),
            historicalAudits.length,
            article.seoScore,
          )}
        />
        <Metric label="Status" value={article.status} />
      </div>

      <div style={grid}>
        <Metric
          label="Editorial Grade"
          value={scoreDisplayValue(
            Boolean(currentAudit),
            historicalAudits.length,
            article.editorialGrade,
          )}
        />
        <Metric
          label="Quality Grade"
          value={scoreDisplayValue(
            Boolean(currentAudit),
            historicalAudits.length,
            article.qualityGrade,
          )}
        />
        <Metric
          label="SEO Grade"
          value={scoreDisplayValue(
            Boolean(currentAudit),
            historicalAudits.length,
            article.seoGrade,
          )}
        />
        <Metric label="Category" value={article.category} />
      </div>

      {!currentAudit ? (
        <div data-audit-state="none" style={card}>
          <h3>No Current Research Audit</h3>
          <p>
            No audit matches this content revision. Legacy and earlier-revision
            audits remain historical.
          </p>
          {(article.status === "review" ||
            article.status === "draft" ||
            article.status === "review-required") && (
            <div style={{ marginTop: "12px" }}>
              <PrepareForReviewButton articleId={article.id} />
            </div>
          )}
        </div>
      ) : (
        <>
          <div data-audit-state="current" style={card}>
            <h3>Current Research Audit</h3>
            <div style={grid}>
              <Metric
                label="Research Confidence"
                value={currentAudit.researchConfidence}
              />
              <Metric
                label="Authority Score"
                value={currentAudit.averageAuthorityScore}
              />
              <Metric
                label="Trust Score"
                value={currentAudit.averageTrustScore}
              />
              <Metric
                label="Verification Score"
                value={currentAudit.averageVerificationScore}
              />
              <Metric
                label="Consensus Score"
                value={currentAudit.consensusScore}
              />
              <Metric
                label="Source Quality"
                value={currentAudit.sourceQualityScore}
              />
            </div>
            <p>
              <strong>Publication Recommendation:</strong>{" "}
              {currentAudit.publicationRecommendation ?? "Not available"}
            </p>
          </div>
          <div style={card}>
            <h3>Evidence Summary</h3>
            <div style={grid}>
              <Metric label="Sources" value={currentAudit.sourceCount} />
              <Metric
                label="Evidence Records"
                value={currentAudit.evidenceCount}
              />
              <Metric label="Facts" value={currentAudit.factCount} />
              <Metric label="Verified" value={currentAudit.verifiedCount} />
              <Metric
                label="Partially Verified"
                value={currentAudit.partiallyVerifiedCount}
              />
              <Metric
                label="Unverified"
                value={currentAudit.unverifiedCount}
              />
            </div>
          </div>
          <JsonCard title="Sources Used" data={currentAudit.sources} />
          <JsonCard title="Evidence Used" data={currentAudit.evidence} />
          <JsonCard title="Facts Extracted" data={currentAudit.facts} />
          <JsonCard title="Consensus Groups" data={currentAudit.consensus} />
        </>
      )}

      <div data-review-history="human" style={card}>
        <h3>Review History</h3>
        {humanReviewNotes.length === 0 ? (
          <p>No review history recorded.</p>
        ) : (
          humanReviewNotes.map((note) => (
            <div
              key={note.id}
              data-review-note={note.action}
              style={{
                padding: "12px",
                marginBottom: "10px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <div>
                <strong>Action:</strong> {note.action}
              </div>
              <div>
                <strong>Reviewer:</strong> {note.reviewer}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {new Date(note.createdAt).toLocaleString()}
              </div>
              <div style={{ marginTop: "8px" }}>
                <strong>Note:</strong>
                <br />
                {note.note || "-"}
              </div>
            </div>
          ))
        )}
      </div>

      {historicalAudits.length > 0 && (
        <div data-audit-state="historical" style={card}>
          <h3>Historical Research Audits</h3>
          <p>
            These audits are preserved for history but do not match the current
            auditable content revision.
          </p>
          {historicalAudits.map((historicalAudit) => (
            <div key={historicalAudit.id} style={historyItem}>
              <strong>Historical / stale</strong>
              <div>ID: {historicalAudit.id}</div>
              <div>
                Created: {new Date(historicalAudit.createdAt).toLocaleString()}
              </div>
              <div>
                Recommendation:{" "}
                {historicalAudit.publicationRecommendation ?? "Not available"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function canShowApprovalActions(
  status: string,
  hasCurrentAudit: boolean,
): boolean {
  return (
    (status === "review-required" || status === "review") && hasCurrentAudit
  );
}

export function scoreDisplayValue(
  hasCurrentAudit: boolean,
  historicalAuditCount: number,
  value?: string | number | null,
): string | number | null {
  if (hasCurrentAudit) return value ?? "Not scored";
  if (historicalAuditCount > 0) return "Not current";
  return value == null ? "Not scored" : "Not current";
}

function Metric({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const isNumber = typeof value === "number";
  return (
    <div style={metric}>
      <div style={{ fontSize: "13px", color: "#666" }}>{label}</div>
      <div
        style={{
          marginTop: "6px",
          fontSize: "22px",
          fontWeight: "bold",
          color: isNumber ? scoreColor(value) : "#111",
        }}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <div style={card}>
      <h3>{title}</h3>
      <pre style={pre}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginTop: "16px",
};

const card: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px",
  marginTop: "20px",
  background: "var(--card)",
};

const metric: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "16px",
  background: "#f8f9fa",
};

const pre: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: "12px",
  overflowX: "auto",
};

const historyItem: React.CSSProperties = {
  padding: "12px",
  marginTop: "10px",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  background: "#f8f9fa",
};
