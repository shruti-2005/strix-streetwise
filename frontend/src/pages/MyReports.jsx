import { useEffect, useState } from "react";
import { issuesApi } from "../api/api";
import { socket } from "../api/socket";
import IssueCard from "../components/IssueCard";

export default function MyReports() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    issuesApi
      .mine()
      .then(({ data }) => setIssues(data.issues))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const onUpdate = (updated) =>
      setIssues((prev) => prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)));
    socket.on("issue:status_update", onUpdate);
    return () => socket.off("issue:status_update", onUpdate);
  }, []);

  return (
    <main className="page" style={{maxWidth:780}}>
      <div className="eyebrow">Citizen report history · live status tracking</div><h1 className="page-title">My reports</h1>
      <p className="text-soft" style={{ marginTop: 0, marginBottom: 20 }}>
        Track what happens after you submit a report — status updates arrive here in real time.
      </p>

      {loading && <p className="text-faint">Loading your reports…</p>}
      {!loading && issues.length === 0 && (
        <div className="card">
          <p className="text-soft" style={{ margin: 0 }}>
            You haven't reported any issues yet. Spotted a pothole or a broken streetlight? Report it and track it here.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {issues.map((issue) => (
          <IssueCard key={issue._id} issue={issue} showPriority />
        ))}
      </div>
    </main>
  );
}
