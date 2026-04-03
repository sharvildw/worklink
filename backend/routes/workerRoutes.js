const express = require("express");
const { body } = require("express-validator");
const { upsertWorkerProfile, getWorkers, getWorkerById, deleteWorker } = require("../controllers/workerController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../utils/validators");
const upload = require("../utils/upload");

const router = express.Router();

router.get("/", getWorkers);
router.get("/:id", getWorkerById);

router.post(
  "/",
  protect,
  authorize("worker", "admin"),
  upload.single("profileImage"),
  [
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("experience").optional().isNumeric().withMessage("Experience must be numeric"),
    body("pricePerHour").optional().isNumeric().withMessage("Price per hour must be numeric"),
    body("hourlyRate").optional().isNumeric().withMessage("Hourly rate must be numeric")
  ],
  validate,
  upsertWorkerProfile
);

router.put(
  "/",
  protect,
  authorize("worker", "admin"),
  upload.single("profileImage"),
  [
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("experience").optional().isNumeric().withMessage("Experience must be numeric"),
    body("pricePerHour").optional().isNumeric().withMessage("Price per hour must be numeric"),
    body("hourlyRate").optional().isNumeric().withMessage("Hourly rate must be numeric")
  ],
  validate,
  upsertWorkerProfile
);

router.patch(
  "/:id",
  protect,
  authorize("worker", "admin"),
  upload.single("profileImage"),
  [
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("experience").optional().isNumeric().withMessage("Experience must be numeric"),
    body("pricePerHour").optional().isNumeric().withMessage("Price per hour must be numeric"),
    body("hourlyRate").optional().isNumeric().withMessage("Hourly rate must be numeric")
  ],
  validate,
  upsertWorkerProfile
);

router.delete("/:id", protect, authorize("admin"), deleteWorker);

module.exports = router;
