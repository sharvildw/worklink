const express = require("express");
const { body } = require("express-validator");
const { register, login, getMe, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../utils/validators");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["user", "worker", "admin"]).withMessage("Role must be user, worker, or admin")
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validate,
  login
);

router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

module.exports = router;
