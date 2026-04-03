const User = require("../models/User");
const Job = require("../models/Job");
const Worker = require("../models/Worker");
const Setting = require("../models/Setting");

const mapAdminWorkerResponse = (worker) => {
  const workerJson = worker.toJSON();
  const user = worker.userId;

  return {
    ...workerJson,
    userId: user?._id ? user._id.toString() : workerJson.userId,
    name: user?.name || "Worker",
    email: user?.email || "",
    avatar: worker.profileImage || user?.avatar || "",
    hourlyRate: worker.pricePerHour,
    about: worker.bio
  };
};

const getAllUsers = async (_req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({
      users: users.map((user) => user.toJSON())
    });
  } catch (error) {
    return next(error);
  }
};

const getAllJobs = async (_req, res, next) => {
  try {
    const jobs = await Job.find()
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

const getAllWorkers = async (_req, res, next) => {
  try {
    const workers = await Worker.find()
      .populate("userId", "name email avatar location")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      workers: workers.map(mapAdminWorkerResponse)
    });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Promise.all([
      Worker.deleteOne({ userId: user._id }),
      Job.deleteMany({ postedBy: user._id }),
      Job.updateMany(
        { applicants: user._id },
        { $pull: { applicants: user._id } }
      ),
      user.deleteOne()
    ]);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const deleteJobAdmin = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await job.deleteOne();
    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const getStats = async (_req, res, next) => {
  try {
    const [totalUsers, totalJobs, totalWorkers, completedJobs, recentUsers, recentJobs] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Worker.countDocuments(),
      Job.countDocuments({ status: "completed" }),
      User.find().select("-password").sort({ createdAt: -1 }).limit(5),
      Job.find().sort({ createdAt: -1 }).limit(5)
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalJobs,
        totalWorkers,
        completedJobs,
        recentUsers: recentUsers.map((user) => user.toJSON()),
        recentJobs: recentJobs.map((job) => job.toJSON())
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getSummary = async (_req, res, next) => {
  try {
    const [totalUsers, totalJobs, totalWorkers, completedJobs, recentUsers, recentJobs] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Worker.countDocuments(),
      Job.countDocuments({ status: "completed" }),
      User.find().select("-password").sort({ createdAt: -1 }).limit(5),
      Job.find().sort({ createdAt: -1 }).limit(5)
    ]);

    return res.status(200).json({
      summary: {
        totalUsers,
        totalJobs,
        totalWorkers,
        completedJobs,
        recentUsers: recentUsers.map((user) => user.toJSON()),
        recentJobs: recentJobs.map((job) => job.toJSON())
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getSettings = async (_req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    return res.status(200).json({ settings: settings.toJSON() });
  } catch (error) {
    return next(error);
  }
};

const saveSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    return res.status(200).json({
      message: "Settings saved successfully",
      settings: settings.toJSON()
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllUsers,
  getAllJobs,
  getAllWorkers,
  deleteUser,
  deleteJobAdmin,
  getStats,
  getSummary,
  getSettings,
  saveSettings
};
