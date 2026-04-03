const mongoose = require("mongoose");
const Job = require("../models/Job");
const Worker = require("../models/Worker");
const { buildPagination, normalizeJobStatus, sanitizeSort } = require("../utils/formatters");

const populateJob = (query) =>
  query
    .populate("postedBy", "name email")
    .populate({
      path: "assignedTo",
      populate: {
        path: "userId",
        select: "name email avatar"
      }
    });

const mapJobResponse = (job) => {
  const jobJson = job.toJSON();

  return {
    ...jobJson,
    postedBy: job.postedBy?._id ? job.postedBy._id.toString() : jobJson.postedBy,
    postedByName: job.postedBy?.name || "Unknown",
    assignedTo: job.assignedTo?._id ? job.assignedTo._id.toString() : jobJson.assignedTo,
    hiredWorker: job.assignedTo?.userId?._id
      ? job.assignedTo.userId._id.toString()
      : jobJson.hiredWorker,
    applicants: (jobJson.applicants || []).map((applicant) => applicant.toString())
  };
};

const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({
      title: req.body.title,
      description: req.body.description,
      budget: req.body.budget,
      location: req.body.location,
      category: req.body.category || "General",
      duration: req.body.duration || "",
      requirements: req.body.requirements || "",
      contactPhone: req.body.contactPhone || req.user.phone || "",
      postedBy: req.user._id
    });

    const populated = await populateJob(Job.findById(job._id));

    return res.status(201).json({
      message: "Job created successfully",
      job: mapJobResponse(populated)
    });
  } catch (error) {
    return next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 9, 1), 50);
    const skip = (page - 1) * limit;
    const filters = {};

    if (req.query.status) {
      filters.status = normalizeJobStatus(req.query.status);
    }

    if (req.query.location) {
      filters.location = { $regex: req.query.location, $options: "i" };
    }

    if (req.query.postedBy && mongoose.Types.ObjectId.isValid(req.query.postedBy)) {
      filters.postedBy = req.query.postedBy;
    }

    if (req.query.applicant && mongoose.Types.ObjectId.isValid(req.query.applicant)) {
      filters.applicants = req.query.applicant;
    }

    if (req.query.hiredWorker) {
      const assignedWorker = await Worker.findOne({
        $or: [{ _id: req.query.hiredWorker }, { userId: req.query.hiredWorker }]
      }).select("_id");

      if (!assignedWorker) {
        return res.status(200).json({
          jobs: [],
          pagination: buildPagination(page, limit, 0)
        });
      }

      filters.assignedTo = assignedWorker._id;
    }

    if (req.query.budget) {
      filters.budget = { $lte: Number(req.query.budget) };
    }

    if (req.query.minBudget || req.query.maxBudget) {
      filters.budget = {};
      if (req.query.minBudget) {
        filters.budget.$gte = Number(req.query.minBudget);
      }
      if (req.query.maxBudget) {
        filters.budget.$lte = Number(req.query.maxBudget);
      }
    }

    if (req.query.q) {
      const regex = { $regex: req.query.q, $options: "i" };
      filters.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
        { requirements: regex }
      ];
    }

    const sort = sanitizeSort(
      req.query.sort,
      {
        latest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        highestBudget: { budget: -1 },
        lowestBudget: { budget: 1 }
      },
      "latest"
    );

    const total = await Job.countDocuments(filters);
    const jobs = await populateJob(
      Job.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
    );

    return res.status(200).json({
      jobs: jobs.map(mapJobResponse),
      pagination: buildPagination(page, limit, total)
    });
  } catch (error) {
    return next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await populateJob(Job.findById(req.params.id));
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json({
      job: mapJobResponse(job)
    });
  } catch (error) {
    return next(error);
  }
};

const applyForJob = async (req, res, next) => {
  try {
    const workerProfile = await Worker.findOne({ userId: req.user._id });
    if (!workerProfile) {
      return res.status(400).json({ message: "Create your worker profile before applying." });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ message: "Applications are closed for this job." });
    }

    if (String(job.postedBy) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot apply to your own job." });
    }

    if (job.applicants.some((applicant) => String(applicant) === String(req.user._id))) {
      return res.status(400).json({ message: "You have already applied for this job." });
    }

    job.applicants.push(req.user._id);
    await job.save();

    const populated = await populateJob(Job.findById(job._id));

    return res.status(200).json({
      message: "Application submitted successfully",
      job: mapJobResponse(populated)
    });
  } catch (error) {
    return next(error);
  }
};

const withdrawApplication = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    job.applicants = job.applicants.filter((applicant) => String(applicant) !== String(req.user._id));
    await job.save();

    const populated = await populateJob(Job.findById(job._id));

    return res.status(200).json({
      message: "Application withdrawn successfully",
      job: mapJobResponse(populated)
    });
  } catch (error) {
    return next(error);
  }
};

const assignWorkerToJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const isOwner = String(job.postedBy) === String(req.user._id);
    if (req.user.role === "user" && !isOwner) {
      return res.status(403).json({ message: "You can only assign workers to your own jobs." });
    }

    const workerIdentifier = req.body.workerId || req.body.userId;
    const worker = await Worker.findOne({
      $or: [{ _id: workerIdentifier }, { userId: workerIdentifier }]
    });

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    const hasApplied = job.applicants.some((applicant) => String(applicant) === String(worker.userId));
    if (!hasApplied && req.user.role !== "admin") {
      return res.status(400).json({ message: "Only applicants can be assigned to the job." });
    }

    job.assignedTo = worker._id;
    job.status = "hired";
    await job.save();

    worker.availability = "busy";
    await worker.save();

    const populated = await populateJob(Job.findById(job._id));

    return res.status(200).json({
      message: "Worker assigned successfully",
      job: mapJobResponse(populated)
    });
  } catch (error) {
    return next(error);
  }
};

const updateJobStatus = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const isOwner = String(job.postedBy) === String(req.user._id);
    let isAssignedWorker = false;

    if (req.user.role === "worker" && job.assignedTo) {
      const worker = await Worker.findById(job.assignedTo);
      isAssignedWorker = Boolean(worker && String(worker.userId) === String(req.user._id));
    }

    if (req.user.role === "user" && !isOwner) {
      return res.status(403).json({ message: "You can only update your own jobs." });
    }
    if (req.user.role === "worker" && !isAssignedWorker) {
      return res.status(403).json({ message: "You are not assigned to this job." });
    }

    const nextStatus = normalizeJobStatus(req.body.status);
    if (!["open", "hired", "completed", "closed"].includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid job status." });
    }

    job.status = nextStatus;
    if (nextStatus === "completed") {
      job.completedDate = new Date();
      if (job.assignedTo) {
        const worker = await Worker.findById(job.assignedTo);
        if (worker) {
          worker.completedJobs += 1;
          worker.earnings += job.budget;
          worker.availability = "available";
          await worker.save();
        }
      }
    }

    if (nextStatus === "open") {
      job.assignedTo = null;
    }

    await job.save();

    const populated = await populateJob(Job.findById(job._id));

    return res.status(200).json({
      message: "Job status updated successfully",
      job: mapJobResponse(populated)
    });
  } catch (error) {
    return next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const isOwner = String(job.postedBy) === String(req.user._id);
    if (req.user.role === "user" && !isOwner) {
      return res.status(403).json({ message: "You can only delete your own jobs." });
    }

    await job.deleteOne();

    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  applyForJob,
  withdrawApplication,
  assignWorkerToJob,
  updateJobStatus,
  deleteJob
};
