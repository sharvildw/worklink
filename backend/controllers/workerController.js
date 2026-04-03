const Worker = require("../models/Worker");
const User = require("../models/User");
const { buildPagination } = require("../utils/formatters");

const mapWorkerResponse = (worker) => {
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

const upsertWorkerProfile = async (req, res, next) => {
  try {
    const payload = {
      skills: req.body.skills || [],
      experience: req.body.experience || 0,
      location: req.body.location || req.user.location || "",
      pricePerHour: req.body.pricePerHour ?? req.body.hourlyRate ?? 0,
      bio: req.body.bio ?? req.body.about ?? "",
      availability: req.body.availability || "available"
    };

    let worker = await Worker.findOne({ userId: req.user._id });

    if (!worker) {
      worker = await Worker.create({
        userId: req.user._id,
        ...payload
      });
    } else {
      Object.assign(worker, payload);
      if (req.file) {
        worker.profileImage = `/uploads/${req.file.filename}`;
      }
      await worker.save();
    }

    if (req.file && !worker.profileImage) {
      worker.profileImage = `/uploads/${req.file.filename}`;
      await worker.save();
    }

    if (req.body.name) {
      req.user.name = req.body.name;
    }
    if (req.body.location) {
      req.user.location = req.body.location;
    }
    if (req.file) {
      req.user.avatar = `/uploads/${req.file.filename}`;
    }
    await req.user.save();

    const populated = await Worker.findById(worker._id).populate("userId", "name email avatar location");

    return res.status(200).json({
      message: "Worker profile saved successfully",
      worker: mapWorkerResponse(populated)
    });
  } catch (error) {
    return next(error);
  }
};

const getWorkers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 9, 1), 50);
    const skip = (page - 1) * limit;
    const workerFilters = {};

    if (req.query.location) {
      workerFilters.location = { $regex: req.query.location, $options: "i" };
    }

    if (req.query.skill) {
      workerFilters.skills = { $elemMatch: { $regex: req.query.skill, $options: "i" } };
    }

    if (req.query.q) {
      const regex = { $regex: req.query.q, $options: "i" };
      const users = await User.find({
        role: "worker",
        $or: [{ name: regex }, { location: regex }]
      }).select("_id");

      workerFilters.$or = [
        { userId: { $in: users.map((user) => user._id) } },
        { skills: { $elemMatch: regex } },
        { bio: regex }
      ];
    }

    const total = await Worker.countDocuments(workerFilters);
    const workers = await Worker.find(workerFilters)
      .populate("userId", "name email avatar location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      workers: workers.map(mapWorkerResponse),
      pagination: buildPagination(page, limit, total)
    });
  } catch (error) {
    return next(error);
  }
};

const getWorkerById = async (req, res, next) => {
  try {
    const worker = await Worker.findOne({
      $or: [{ _id: req.params.id }, { userId: req.params.id }]
    }).populate("userId", "name email avatar location");

    if (!worker) {
      return res.status(404).json({ message: "Worker profile not found" });
    }

    return res.status(200).json({
      worker: mapWorkerResponse(worker)
    });
  } catch (error) {
    return next(error);
  }
};

const deleteWorker = async (req, res, next) => {
  try {
    const worker = await Worker.findOne({
      $or: [{ _id: req.params.id }, { userId: req.params.id }]
    });

    if (!worker) {
      return res.status(404).json({ message: "Worker profile not found" });
    }

    await worker.deleteOne();

    return res.status(200).json({ message: "Worker profile deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  upsertWorkerProfile,
  getWorkers,
  getWorkerById,
  deleteWorker
};
