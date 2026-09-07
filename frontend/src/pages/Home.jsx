import { useEffect, useState, useMemo } from "react";
import IssueMap from "../components/IssueMap";
import IssueCard from "../components/IssueCard";
import HazardAlertBanner from "../components/HazardAlertBanner";
import { issuesApi } from "../api/api";
import { socket } from "../api/socket";
import { CATEGORIES } from "../api/categories";

export default function Home() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { timeout: 8000 }
      );
    }
  }, []);

  useEffect(() => {
    issuesApi
      .list({ limit: 300 })
      .then(({ data }) => setIssues(data.issues))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onNew = (issue) => setIssues((prev) => [issue, ...prev]);
    const onUpdate = (updated) =>
      setIssues((prev) => prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)));
    socket.on("issue:new", onNew);
    socket.on("issue:status_update", onUpdate);
    return () => {
      socket.off("issue:new", onNew);
      socket.off("issue:status_update", onUpdate);
    };
  }, []);

  const filtered = useMemo(
    () => (categoryFilter === "all" ? issues : issues.filter((i) => i.category === categoryFilter)),
    [issues, categoryFilter]
  );

  return (
    <>
      <HazardAlertBanner userLocation={userLocation} />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "1.6rem" }}>Live issue map</h1>
            <p className="text-soft" style={{ margin: "4px 0 0" }}>
              {loading ? "Loading reports…" : `${issues.length} issues reported across the city`}
            </p>
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 4, border: "1px solid var(--color-border-strong)" }}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        <IssueMap issues={filtered} userLocation={userLocation} />

        <h2 style={{ fontSize: "1.15rem", margin: "28px 0 14px" }}>Recent reports</h2>
        <div className="flex flex-col gap-3">
          {filtered.slice(0, 20).map((issue) => (
            <IssueCard key={issue._id} issue={issue} />
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-faint">No issues reported yet in this category. Be the first to report one.</p>
          )}
        </div>
      </div>
    </>
  );
}
