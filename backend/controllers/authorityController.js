const asyncHandler = require("express-async-handler");
const Issue = require("../models/Issue");
const { emitStatusUpdate, emitConstructionAlert } = require("../sockets/index");

// @route GET /api/authority/queue
// @desc  The authority dashboard's main worklist: filterable, sorted by
//        priority then recency so the most urgent issues surface first.
const getQueue = asyncHandler(async (req, res) => {
  const { status, category, department, assigned } = req.query;
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (department) query.assignedDepartment = department;
  if (assigned === "unassigned") query.assignedTo = null;
  if (assigned === "me") query.assignedTo = req.user._id;

  const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };

  const issues = await Issue.find(query)
    .populate("reportedBy", "name isAnonymous")
    .populate("assignedTo", "name department")
    .sort({ createdAt: -1 })
    .limit(500);

  issues.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  res.status(200).json({ count: issues.length, issues });
});

// @route PATCH /api/authority/issues/:id/verify
// @desc  Authority confirms or overrides the ML validation, and sets priority.
const verifyIssue = asyncHandler(async (req, res) => {
  const { priority, note } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404);
    throw new Error("Issue not found");
  }

  if (priority) issue.priority = priority;
  issue.statusHistory.push({
    status: issue.status,
    note: note || "Verified by authority",
    changedBy: req.user._id,
  });

  await issue.save();
  emitStatusUpdate(issue);
  res.status(200).json({ issue });
});

// @route PATCH /api/authority/issues/:id/assign
const assignIssue = asyncHandler(async (req, res) => {
  const { assignedTo, assignedDepartment } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404);
    throw new Error("Issue not found");
  }

  issue.assignedTo = assignedTo || issue.assignedTo;
  issue.assignedDepartment = assignedDepartment || issue.assignedDepartment;
  if (issue.status === "pending") {
    issue.status = "in_progress";
    issue.statusHistory.push({
      status: "in_progress",
      note: "Assigned and work started",
      changedBy: req.user._id,
    });
  }

  await issue.save();
  const populated = await issue.populate("assignedTo", "name department");
  emitStatusUpdate(populated);
  res.status(200).json({ issue: populated });
});

// @route PATCH /api/authority/issues/:id/status
// @desc  Move an issue through pending -> in_progress -> resolved (or reject it)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!Issue.STATUS_FLOW.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${Issue.STATUS_FLOW.join(", ")}`);
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404);
    throw new Error("Issue not found");
  }

  issue.status = status;
  issue.statusHistory.push({ status, note, changedBy: req.user._id });

  // Resolving a construction hazard clears it from geo-fenced alerts
  if (status === "resolved" && issue.isConstructionHazard) {
    issue.hazardActiveUntil = new Date();
  }

  await issue.save();
  emitStatusUpdate(issue);
  if (issue.isConstructionHazard && status === "in_progress") {
    emitConstructionAlert(issue);
  }

  res.status(200).json({ issue });
});

// @route GET /api/authority/analytics
// @desc  Aggregate stats for the admin dashboard: counts by category/status,
//        and the top locality hotspots.
const getAnalytics = asyncHandler(async (req, res) => {
  const [byCategory, byStatus, hotspots, totals] = await Promise.all([
    Issue.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Issue.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Issue.aggregate([
      { $match: { locality: { $ne: null } } },
      { $group: { _id: "$locality", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Issue.countDocuments(),
  ]);

  res.status(200).json({
    totalIssues: totals,
    byCategory,
    byStatus,
    hotspots,
  });
});

module.exports = { getQueue, verifyIssue, assignIssue, updateStatus, getAnalytics };
