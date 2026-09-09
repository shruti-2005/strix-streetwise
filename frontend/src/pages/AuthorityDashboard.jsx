import { useEffect, useState, useCallback } from "react";
import { authorityApi } from "../api/api";
import { socket } from "../api/socket";
import { useAuth } from "../context/AuthContext";
import { categoryMeta, CATEGORIES, PRIORITY_LABELS } from "../api/categories";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import { UPLOADS_BASE_URL } from "../api/api";
import { Link } from "react-router-dom";
import "./AuthorityDashboard.css";

const STATUS_OPTIONS = ["pending", "in_progress", "resolved", "rejected"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [totalReports, setTotalReports] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(() => {
    setLoading(true);
    authorityApi
      .queue({ status: statusFilter || undefined, category: categoryFilter || undefined })
      .then(({ data }) => setIssues(data.issues))
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter]);

  useEffect(loadQueue, [loadQueue]);

  const loadTotal = useCallback(() => {
    authorityApi.analytics().then(({ data }) => setTotalReports(data.totalIssues)).catch(() => setTotalReports(0));
  }, []);

  useEffect(loadTotal, [loadTotal]);

  useEffect(() => {
    socket.emit("join_authority_room");
    const onNew = () => { loadQueue(); loadTotal(); };
    const onUpdate = (updated) =>
      setIssues((prev) => prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)));
    socket.on("authority:new_issue", onNew);
    socket.on("issue:status_update", onUpdate);
    return () => {
      socket.off("authority:new_issue", onNew);
      socket.off("issue:status_update", onUpdate);
    };
  }, [loadQueue, loadTotal]);

  const setPriority = async (issue, priority) => {
    const { data } = await authorityApi.verify(issue._id, { priority });
    setIssues((prev) => prev.map((i) => (i._id === issue._id ? data.issue : i)));
  };

  const assignToMe = async (issue) => {
    const { data } = await authorityApi.assign(issue._id, {
      assignedTo: user.id,
      assignedDepartment: user.department || "General",
    });
    setIssues((prev) => prev.map((i) => (i._id === issue._id ? data.issue : i)));
  };

  const setStatus = async (issue, status) => {
    const { data } = await authorityApi.updateStatus(issue._id, { status });
    setIssues((prev) => prev.map((i) => (i._id === issue._id ? data.issue : i)));
  };

  return (<main className="authority-shell"><AuthoritySidebar /> <section className="authority-content">
      <div id="overview" className="authority-section-anchor" />
      <div className="eyebrow">Municipal command / operations portal · ● Live updates active</div><h1 className="page-title">{user?.role === "admin" ? "Admin Control Panel" : "Authority Dashboard"}</h1><p className="page-subtitle">
        Verify, prioritize, assign, and resolve incoming civic reports.
      </p>

      <div className="authority-cards"><Metric label="Total Reports" value={totalReports}/></div>

      <div className="flex gap-3" style={{ margin: "20px 0" }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-faint">Loading queue…</p>}

      <div id="reports-queue" className="queue-panel">
        {issues.map((issue) => (
          <QueueRow
            key={issue._id}
            issue={issue}
            onSetPriority={setPriority}
            onAssignToMe={assignToMe}
            onSetStatus={setStatus}
          />
        ))}
        {!loading && issues.length === 0 && <p className="text-faint">No issues match this filter.</p>}
      </div>
    </section></main>
  );
}

function AuthoritySidebar(){ return <aside className="authority-side"><h2>◉ STRIX</h2><div className="eyebrow" style={{color:"#55d9ce",margin:"14px 10px"}}>Municipal command</div><a href="#overview" className="active">▦ Overview</a><a href="#reports-queue">▣ Reports queue</a><Link to="/live-map">▤ Live Map</Link></aside> }
function Metric({label,value}){return <div className="metric"><label>{label}</label><strong>{value}</strong><small>Live system total</small></div>}

function QueueRow({ issue, onSetPriority, onAssignToMe, onSetStatus }) {
  const meta = categoryMeta(issue.category);
  const imgSrc = issue.imageUrl?.startsWith("http") ? issue.imageUrl : `${UPLOADS_BASE_URL}${issue.imageUrl}`;

  return (
    <div className={`card card-strip status-${issue.status} queue-row`}>
      <img src={imgSrc} alt={meta.label} className="queue-row-img" onError={(e) => (e.target.style.opacity = 0.15)} />
      <div className="queue-row-body">
        <div className="flex items-center justify-between gap-2" style={{ flexWrap: "wrap" }}>
          <strong>{meta.icon} {meta.label}</strong>
          <div className="flex gap-2">
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
        </div>
        <p className="text-soft" style={{ fontSize: "0.86rem", margin: "6px 0" }}>{issue.description}</p>
        <div className="text-faint" style={{ fontSize: "0.76rem", marginBottom: 10 }}>
          {issue.location?.address || `${issue.location?.coordinates?.[1]?.toFixed(4)}, ${issue.location?.coordinates?.[0]?.toFixed(4)}`}
          {issue.mlValidation && ` · CNN confidence: ${Math.round((issue.mlValidation.confidence || 0) * 100)}%`}
          {issue.assignedTo && ` · Assigned: ${issue.assignedTo.name}`}
        </div>

        <div className="queue-actions">
          <Link className="btn btn-outline btn-sm" to={`/authority/issues/${issue._id}`}>Inspect details</Link>
          <select value={issue.priority} onChange={(e) => onSetPriority(issue, e.target.value)}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]} priority</option>
            ))}
          </select>

          {!issue.assignedTo && (
            <button className="btn btn-outline btn-sm" onClick={() => onAssignToMe(issue)}>
              Assign to me
            </button>
          )}

          {issue.status !== "in_progress" && issue.status !== "resolved" && (
            <button className="btn btn-authority btn-sm" onClick={() => onSetStatus(issue, "in_progress")}>
              Start progress
            </button>
          )}
          {issue.status !== "resolved" && (
            <button className="btn btn-primary btn-sm" onClick={() => onSetStatus(issue, "resolved")}>
              Mark resolved
            </button>
          )}
          {issue.status !== "rejected" && (
            <button className="btn btn-ghost btn-sm" onClick={() => onSetStatus(issue, "rejected")}>
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
