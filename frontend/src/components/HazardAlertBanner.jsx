import { useEffect, useState } from "react";
import { issuesApi } from "../api/api";
import { socket } from "../api/socket";
import "./HazardAlertBanner.css";

export default function HazardAlertBanner({ userLocation }) {
  const [hazards, setHazards] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set());

  useEffect(() => {
    if (!userLocation) return;
    issuesApi
      .nearby({ latitude: userLocation[0], longitude: userLocation[1], radius: 1500 })
      .then(({ data }) => setHazards(data.issues))
      .catch(() => {});
  }, [userLocation]);

  useEffect(() => {
    const onAlert = (issue) => {
      setHazards((prev) => (prev.some((h) => h._id === issue._id) ? prev : [issue, ...prev]));
    };
    socket.on("hazard:alert", onAlert);
    return () => socket.off("hazard:alert", onAlert);
  }, []);

  const visible = hazards.filter((h) => !dismissed.has(h._id));
  if (visible.length === 0) return null;

  return (
    <div className="hazard-banner">
      {visible.map((h) => (
        <div key={h._id} className="hazard-banner-row">
          <span className="hazard-banner-icon">⚠️</span>
          <span className="hazard-banner-text">
            <strong>Construction zone ahead.</strong> {h.description} {h.location?.address ? `— ${h.location.address}` : ""} Consider an alternate route.
          </span>
          <button
            className="btn-ghost btn-sm"
            onClick={() => setDismissed((prev) => new Set(prev).add(h._id))}
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
