export const CATEGORIES = [
  { value: "pothole", label: "Pothole", icon: "\u{1F573}\uFE0F", color: "#8B5A2B" },
  { value: "streetlight", label: "Streetlight", icon: "\u{1F4A1}", color: "#C98A1B" },
  { value: "water_leakage", label: "Water Leakage", icon: "\u{1F4A7}", color: "#2461A8" },
  { value: "garbage", label: "Garbage", icon: "\u{1F5D1}\uFE0F", color: "#2F7D4F" },
  { value: "construction_hazard", label: "Construction Hazard", icon: "\u{1F6A7}", color: "#C1272D" },
];

export function categoryMeta(value) {
  return CATEGORIES.find((c) => c.value === value) || { label: value, icon: "\u{2757}", color: "#4B5057" };
}

export const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

export const PRIORITY_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};
