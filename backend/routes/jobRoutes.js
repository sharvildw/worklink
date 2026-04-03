const express = require("express");
const { body } = require("express-validator");
const {
  createJob,
  getJobs,
  getJobById,
  applyForJob,
  withdrawApplication,
  assignWorkerToJob,
  updateJobStatus,
  deleteJob
} = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../utils/validators");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("user", "admin"),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").trim().isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
    body("budget").isNumeric().withMessage("Budget must be a number"),
    body("location").trim().notEmpty().withMessage("Location is required")
  ],
  validate,
  createJob
);

router.get("/", getJobs);
router.get("/:id", getJobById);
router.put("/:id", protect, authorize("user", "admin", "worker"), updateJobStatus);
router.delete("/:id", protect, authorize("user", "admin"), deleteJob);

router.put("/apply/:id", protect, authorize("worker"), applyForJob);
router.put("/assign/:id", protect, authorize("user", "admin"), assignWorkerToJob);
router.put("/status/:id", protect, authorize("user", "admin", "worker"), updateJobStatus);

router.post("/:id/apply", protect, authorize("worker"), applyForJob);
router.post("/:id/hire", protect, authorize("user", "admin"), assignWorkerToJob);
router.post("/:id/withdraw", protect, authorize("worker"), withdrawApplication);
router.post("/:id/close", protect, authorize("user", "admin"), (req, _res, next) => {
  req.body.status = "closed";
  next();
}, updateJobStatus);
router.post("/:id/complete", protect, authorize("user", "admin", "worker"), (req, _res, next) => {
  req.body.status = "completed";
  next();
}, updateJobStatus);

module.exports = router;
