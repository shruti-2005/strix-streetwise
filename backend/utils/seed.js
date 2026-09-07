// Run with: npm run seed
// Creates demo authority accounts + a handful of sample issues so the
// frontend (map, dashboards, analytics) has something to show immediately.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Issue = require("../models/Issue");

const DEMO_CENTER = { lat: 28.6139, lng: 77.209 }; // New Delhi - swap for your city

function jitter(base, spread = 0.02) {
  return base + (Math.random() - 0.5) * spread;
}

async function seed() {
  await connectDB();
  console.log("[seed] Clearing existing demo data...");
  await Issue.deleteMany({});
  await User.deleteMany({ email: { $in: ["roads.authority@strix.demo", "sanitation.authority@strix.demo"] } });

  console.log("[seed] Creating authority accounts...");
  const roadsAuthority = await User.create({
    name: "Roads & Infrastructure Dept.",
    email: "roads.authority@strix.demo",
    password: "password123",
    role: "authority",
    department: "Roads",
  });

  const sanitationAuthority = await User.create({
    name: "Sanitation Dept.",
    email: "sanitation.authority@strix.demo",
    password: "password123",
    role: "authority",
    department: "Sanitation",
  });

  const citizen = await User.create({
    name: "Demo Citizen",
    email: "citizen@strix.demo",
    password: "password123",
    role: "citizen",
  });

  console.log("[seed] Creating sample issues...");
  const samples = [
    { category: "pothole", description: "Deep pothole causing traffic slowdown near the market junction.", status: "pending", priority: "high" },
    { category: "streetlight", description: "Streetlight has been out for two weeks, area is unsafe at night.", status: "in_progress", priority: "medium", assignedTo: roadsAuthority._id, assignedDepartment: "Roads" },
    { category: "water_leakage", description: "Continuous water leakage from underground pipeline flooding the sidewalk.", status: "pending", priority: "critical" },
    { category: "garbage", description: "Garbage has piled up uncollected for over a week.", status: "resolved", priority: "medium", assignedTo: sanitationAuthority._id, assignedDepartment: "Sanitation" },
    { category: "construction_hazard", description: "Ongoing road construction with no warning signs or barricades.", status: "in_progress", priority: "high", isConstructionHazard: true, assignedTo: roadsAuthority._id, assignedDepartment: "Roads" },
  ];

  for (const s of samples) {
    await Issue.create({
      ...s,
      imageUrl: "/uploads/placeholder.jpg",
      locality: "Downtown",
      reportedBy: citizen._id,
      mlValidation: { isValid: true, confidence: 0.91, predictedCategory: s.category, mode: "mock", checkedAt: new Date() },
      location: {
        type: "Point",
        coordinates: [jitter(DEMO_CENTER.lng), jitter(DEMO_CENTER.lat)],
        address: "Downtown demo location",
      },
      hazardActiveUntil: s.isConstructionHazard ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
    });
  }

  console.log("[seed] Done. Demo logins:");
  console.log("  Authority (Roads):      roads.authority@strix.demo / password123");
  console.log("  Authority (Sanitation): sanitation.authority@strix.demo / password123");
  console.log("  Citizen:                citizen@strix.demo / password123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
