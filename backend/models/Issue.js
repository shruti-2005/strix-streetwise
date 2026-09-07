const mongoose = require("mongoose");

const ISSUE_CATEGORIES = [
  "pothole",
  "streetlight",
  "water_leakage",
  "garbage",
  "construction_hazard",
];

const STATUS_FLOW = ["pending", "in_progress", "resolved", "rejected"];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUS_FLOW, required: true },
    note: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ISSUE_CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    autoCaption: { type: String }, // generated caption, if ML captioning available

    imageUrl: { type: String, required: true },

    // GeoJSON point for geospatial queries ($near, geofencing)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        // [longitude, latitude]
        type: [Number],
        required: true,
      },
      address: { type: String }, // reverse-geocoded / user supplied label
    },

    locality: { type: String, index: true },

    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ML validation result from the Flask CNN microservice
    mlValidation: {
      isValid: { type: Boolean, default: null },
      confidence: { type: Number, default: null }, // 0-1
      predictedCategory: { type: String },
      mode: { type: String, enum: ["model", "mock"], default: "mock" },
      checkedAt: { type: Date },
    },

    status: { type: String, enum: STATUS_FLOW, default: "pending" },
    statusHistory: { type: [statusHistorySchema], default: [] },

    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedDepartment: { type: String },

    // Marks this as an active construction hazard for geo-fenced alerts
    isConstructionHazard: { type: Boolean, default: false },
    hazardRadiusMeters: { type: Number, default: 300 },
    hazardActiveUntil: { type: Date },

    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

issueSchema.index({ location: "2dsphere" });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ createdAt: -1 });

issueSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({ status: this.status, changedBy: this.reportedBy });
  }
  next();
});

issueSchema.statics.CATEGORIES = ISSUE_CATEGORIES;
issueSchema.statics.STATUS_FLOW = STATUS_FLOW;

module.exports = mongoose.model("Issue", issueSchema);
