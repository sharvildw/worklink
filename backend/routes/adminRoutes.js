const express = require("express");
const {
  getAllUsers,
  getAllJobs,
  getAllWorkers,
  deleteUser,
  deleteJobAdmin,
  getStats,
  getSummary,
  getSettings,
  saveSettings
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/users", getAllUsers);
router.get("/jobs", getAllJobs);
router.get("/workers", getAllWorkers);
router.delete("/user/:id", deleteUser);
router.delete("/job/:id", deleteJobAdmin);
router.get("/stats", getStats);
router.get("/summary", getSummary);
router.get("/settings", getSettings);
router.post("/settings", saveSettings);

module.exports = router;
