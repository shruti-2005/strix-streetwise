const asyncHandler = require("express-async-handler");
const path = require("path");
const Issue = require("../models/Issue");
const { validateImage, getCaption } = require("../utils/mlClient");
const { emitNewIssue, emitStatusUpdate } = require("../sockets/index");

// @route POST /api/issues
// @desc  Core report flow: image + category + location + description ->
//        CNN validation -> save -> broadcast to live map & authority dashboard
const createIssue = asyncHandler(async (req, res) => {
  const { category, description, latitude, longitude, address, locality } = req.body;

  if (!req.file) {
    res.status(400);
    throw new Error("An image of the issue is required");
  }
  if (!category || !Issue.CATEGORIES.includes(category)) {
    res.status(400);
    throw new Error(`category must be one of: ${Issue.CATEGORIES.join(", ")}`);
  }
  if (!description) {
    res.status(400);
    throw new Error("A short description is required");
  }
  if (!latitude || !longitude) {
    res.status(400);
    throw new Error("GPS latitude/longitude are required");
  }

  const imagePath = req.file.path;
  const imageUrl = `/uploads/${path.basename(imagePath)}`;

  // 1. CNN validation - does the image actually match the selected category?
  const validation = await validateImage(imagePath, category);

  // 2. Optional auto-caption (never blocks submission if it fails)
  const autoCaption = await getCaption(imagePath);

  // 3. Reject clearly irrelevant images before they ever reach an authority
  if (validation.isValid === false && validation.confidence > 0.6) {
    return res.status(422).json({
      message:
        "The uploaded image doesn't appear to match the selected category. Please upload a clearer photo of the issue.",
      validation,
    });
  }

  const isConstructionHazard = category === "construction_hazard";

  const issue = await Issue.create({
    category,
    description,
    autoCaption,
    imageUrl,
    location: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
      address,
    },
    locality,
    reportedBy: req.user._id,
    mlValidation: {
      isValid: validation.isValid,
      confidence: validation.confidence,
      predictedCategory: validation.predictedCategory,
      mode: validation.mode,
      checkedAt: new Date(),
    },
    isConstructionHazard,
    hazardActiveUntil: isConstructionHazard
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // default 30 days
      : undefined,
  });

  req.user.reportsCount += 1;
  await req.user.save();

  const populated = await issue.populate("reportedBy", "name isAnonymous");
  emitNewIssue(populated);

  res.status(201).json({ issue: populated, validation });
});

// @route GET /api/issues
// @desc  List issues for the live map / feed. Supports bounding-box, category,
//        and status filters so the frontend map only pulls what's on screen.
const getIssues = asyncHandler(async (req, res) => {
  const { category, status, locality, swLat, swLng, neLat, neLng, limit } = req.query;

  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (locality) query.locality = locality;

  if (swLat && swLng && neLat && neLng) {
    query.location = {
      $geoWithin: {
        $box: [
          [Number(swLng), Number(swLat)],
          [Number(neLng), Number(neLat)],
        ],
      },
    };
  }

  const issues = await Issue.find(query)
    .populate("reportedBy", "name isAnonymous")
    .populate("assignedTo", "name department")
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 500);

  res.status(200).json({ count: issues.length, issues });
});

// @route GET /api/issues/nearby
// @desc  Geo-fenced query: "what hazards/issues are near this citizen right now?"
//        Powers the construction hazard alert feature.
const getNearbyIssues = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  if (!latitude || !longitude) {
    res.status(400);
    throw new Error("latitude and longitude are required");
  }
  const radiusMeters = Number(radius) || 1000;

  const issues = await Issue.find({
    isConstructionHazard: true,
    status: { $in: ["pending", "in_progress"] },
    hazardActiveUntil: { $gte: new Date() },
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
        $maxDistance: radiusMeters,
      },
    },
  }).limit(50);

  res.status(200).json({ count: issues.length, issues });
});

// @route GET /api/issues/mine
const getMyIssues = asyncHandler(async (req, res) => {
  const issues = await Issue.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ count: issues.length, issues });
});

// @route GET /api/issues/:id
const getIssueById = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate("reportedBy", "name isAnonymous")
    .populate("assignedTo", "name department")
    .populate("statusHistory.changedBy", "name role");

  if (!issue) {
    res.status(404);
    throw new Error("Issue not found");
  }
  res.status(200).json({ issue });
});

// @route POST /api/issues/:id/upvote
// @desc  Lets citizens confirm "this is still a problem" - useful signal for
//        authority prioritization without needing a full duplicate report.
const upvoteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404);
    throw new Error("Issue not found");
  }
  const already = issue.upvotedBy.some((id) => id.equals(req.user._id));
  if (already) {
    issue.upvotedBy = issue.upvotedBy.filter((id) => !id.equals(req.user._id));
    issue.upvotes = Math.max(0, issue.upvotes - 1);
  } else {
    issue.upvotedBy.push(req.user._id);
    issue.upvotes += 1;
  }
  await issue.save();
  emitStatusUpdate(issue);
  res.status(200).json({ issue });
});

module.exports = {
  createIssue,
  getIssues,
  getNearbyIssues,
  getMyIssues,
  getIssueById,
  upvoteIssue,
};
