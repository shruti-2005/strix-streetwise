import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { issuesApi } from "../api/api";

export default function Home() {
  const [stats, setStats] = useState(null);
  useEffect(() => { issuesApi.dashboard().then(({data}) => setStats(data)).catch(() => setStats({total:0,pending:0,inProgress:0,resolved:0})); }, []);

  return (
    <main className="page">
      <section className="hero"><div className="eyebrow">● Live telemetry active &nbsp; · &nbsp; City grid synced</div><div className="hero-greeting">Good morning 👋</div><h1>Help make your neighborhood better.</h1><p>Report problems, follow their progress in real time, and stay ahead of critical public-infrastructure alerts in your ward.</p><div className="action-row"><Link className="dark-btn" to="/report">⊕ Report an Issue</Link><Link className="white-btn" to="/live-map">◎ Explore Live Map</Link></div></section>
      <section className="metric-grid"><Metric kind="dark" label="My reports" value={stats?.total} note="Total submitted by you"/><Metric kind="pending" label="Pending" value={stats?.pending} note="Awaiting civic dispatch"/><Metric label="In progress" value={stats?.inProgress} note="Assigned & active work"/><Metric kind="resolved" label="Resolved" value={stats?.resolved} note="Verified by city"/></section>
      <section className="notice"><b>🚧 Construction Zone Nearby</b><p>Road construction is currently active near your locality. Use the live map to see the affected corridor and safety notes.</p><Link className="white-btn" to="/live-map">View on Map</Link></section>
    </main>
  );
}
function Metric({label,value,note,kind=""}) { return <div className={`metric ${kind}`}><label>{label}</label><strong>{value ?? "—"}</strong><small>{note}</small></div>; }
