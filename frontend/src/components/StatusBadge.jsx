import { STATUS_LABELS } from "../api/categories";

export default function StatusBadge({ status }) {
  return (
    <span className={`badge status-${status}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
