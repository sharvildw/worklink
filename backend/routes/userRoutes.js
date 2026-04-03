const express = require("express");
const { body } = require("express-validator");
const { getProfile, updateProfile, getUserDashboard, getUserById } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const validate = require("../utils/validators");
const upload = require("../utils/upload");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.get("/dashboard", protect, getUserDashboard);
router.get("/:id", protect, getUserById);

router.put(
  "/profile",
  protect,
  upload.single("avatar"),
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("phone").optional().trim(),
    body("location").optional().trim(),
    body("company").optional().trim()
  ],
  validate,
  updateProfile
);

router.patch(
  "/profile",
  protect,
  upload.single("avatar"),
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("phone").optional().trim(),
    body("location").optional().trim(),
    body("company").optional().trim()
  ],
  validate,
  updateProfile
);

module.exports = router;
