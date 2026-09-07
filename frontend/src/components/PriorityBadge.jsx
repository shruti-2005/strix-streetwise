import { PRIORITY_LABELS } from "../api/categories";

export default function PriorityBadge({ priority }) {
  return <span className={`badge priority-${priority}`}>{PRIORITY_LABELS[priority] || priority}</span>;
}
