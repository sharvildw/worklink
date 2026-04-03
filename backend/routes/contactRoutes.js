const express = require("express");
const { body } = require("express-validator");
const { createMessage } = require("../controllers/contactController");
const validate = require("../utils/validators");

const router = express.Router();

router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("message").trim().isLength({ min: 10 }).withMessage("Message must be at least 10 characters")
  ],
  validate,
  createMessage
);

module.exports = router;
