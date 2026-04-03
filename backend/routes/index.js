const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const workerRoutes = require("./workerRoutes");
const jobRoutes = require("./jobRoutes");
const adminRoutes = require("./adminRoutes");
const contactRoutes = require("./contactRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/workers", workerRoutes);
router.use("/jobs", jobRoutes);
router.use("/admin", adminRoutes);
router.use("/contact", contactRoutes);

module.exports = router;
