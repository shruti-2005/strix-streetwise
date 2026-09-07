const express = require("express");
const router = express.Router();
const {
  getQueue,
  verifyIssue,
  assignIssue,
  updateStatus,
  getAnalytics,
} = require("../controllers/authorityController");
const { protect, authorize } = require("../middleware/auth");

// Every route here requires an authenticated authority/admin user
router.use(protect, authorize("authority", "admin"));

router.get("/queue", getQueue);
router.get("/analytics", getAnalytics);
router.patch("/issues/:id/verify", verifyIssue);
router.patch("/issues/:id/assign", assignIssue);
router.patch("/issues/:id/status", updateStatus);

module.exports = router;
