import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { categoryMeta } from "../api/categories";
import StatusBadge from "./StatusBadge";
import "./IssueMap.css";

const DEFAULT_CENTER = [28.6139, 77.209]; // fallback: New Delhi - overridden by geolocation when available

function markerIcon(issue) {
  const meta = categoryMeta(issue.category);
  const ring = issue.isConstructionHazard ? "#C1272D" : meta.color;
  return L.divIcon({
    className: "strix-marker",
    html: `<div class="strix-marker-pin" style="--pin-color:${ring}">${meta.icon}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -26],
  });
}

function RecenterOnFirstFix({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 14, { animate: true });
  }, [position, map]);
  return null;
}

export default function IssueMap({ issues, userLocation, height = "440px" }) {
  const center = userLocation || DEFAULT_CENTER;

  const hazardIssues = useMemo(() => issues.filter((i) => i.isConstructionHazard), [issues]);

  return (
    <div className="issue-map-wrap card" style={{ padding: 0, overflow: "hidden", height }}>
      <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && <RecenterOnFirstFix position={userLocation} />}

        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: "strix-marker",
              html: `<div class="strix-user-dot"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {hazardIssues.map((issue) => (
          <Circle
            key={`radius-${issue._id}`}
            center={[issue.location.coordinates[1], issue.location.coordinates[0]]}
            radius={issue.hazardRadiusMeters || 300}
            pathOptions={{ color: "#C1272D", fillColor: "#C1272D", fillOpacity: 0.08, weight: 1 }}
          />
        ))}

        {issues.map((issue) => (
          <Marker
            key={issue._id}
            position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
            icon={markerIcon(issue)}
          >
            <Popup>
              <div className="map-popup">
                <strong>{categoryMeta(issue.category).label}</strong>
                <p>{issue.description}</p>
                <StatusBadge status={issue.status} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
