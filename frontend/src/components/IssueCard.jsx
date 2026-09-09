import { categoryMeta } from "../api/categories";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { UPLOADS_BASE_URL } from "../api/api";
import "./IssueCard.css";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function IssueCard({ issue, onClick, showPriority = false, footer }) {
  const meta = categoryMeta(issue.category);
  const imgSrc = issue.imageUrl?.startsWith("http") ? issue.imageUrl : `${UPLOADS_BASE_URL}${issue.imageUrl}`;

  return (
    <div className={`issue-card card card-strip status-${issue.status}`} onClick={onClick} role={onClick ? "button" : undefined}>
      <div className="issue-card-media">
        <img src={imgSrc} alt={meta.label} loading="lazy" onError={(e) => (e.target.style.opacity = 0.15)} />
        <span className="issue-card-cat-icon" title={meta.label}>{meta.icon}</span>
      </div>
      <div className="issue-card-body">
        <div className="flex items-center justify-between gap-2">
          <span className="issue-card-cat">{meta.label}</span>
          <span className="text-faint" style={{ fontSize: "0.76rem" }}>{timeAgo(issue.createdAt)}</span>
        </div>
        <p className="issue-card-desc">{issue.description}</p>
        <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
          <StatusBadge status={issue.status} />
          {showPriority && <PriorityBadge priority={issue.priority} />}
          {issue.isConstructionHazard && <span className="badge" style={{ background: "var(--color-hazard-tint)", color: "var(--color-hazard)" }}>⚠ Hazard</span>}
        </div>
        {footer}
      </div>
    </div>
  );
}
