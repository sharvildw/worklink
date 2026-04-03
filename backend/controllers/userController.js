const User = require("../models/User");
const Job = require("../models/Job");

const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      user: req.user.toJSON()
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ["name", "phone", "location", "company", "avatar"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    if (req.file) {
      req.user.avatar = `/uploads/${req.file.filename}`;
    }

    await req.user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: req.user.toJSON()
    });
  } catch (error) {
    return next(error);
  }
};

const getUserDashboard = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .populate("postedBy", "name email")
      .populate({
        path: "assignedTo",
        populate: {
          path: "userId",
          select: "name email"
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      jobs: jobs.map((job) => ({
        ...job.toJSON(),
        postedByName: job.postedBy?.name || "Unknown"
      }))
    });
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserDashboard,
  getUserById
};
