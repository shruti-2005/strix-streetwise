const express = require("express");
const router = express.Router();
const {
  createIssue,
  getIssues,
  getNearbyIssues,
  getMyIssues,
  getIssueById,
  upvoteIssue,
} = require("../controllers/issueController");
const { protect } = require("../middleware/auth");
const upload = require("../utils/upload");

router.get("/", getIssues); // public - live map
router.get("/nearby", getNearbyIssues); // public - geo-fenced hazard alerts
router.get("/mine", protect, getMyIssues);
router.get("/:id", getIssueById);

router.post("/", protect, upload.single("image"), createIssue);
router.post("/:id/upvote", protect, upvoteIssue);

module.exports = router;
